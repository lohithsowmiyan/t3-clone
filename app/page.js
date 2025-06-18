// app/page.jsx
'use client'
import React from 'react';
import './globals.css'; // or wherever your global styles are
import {Search, Attach, Lens, Login, Watemark, Drop, Eye, Globe, Book, Brain} from './components/Icons.jsx';
import Thread from './components/Thread.jsx';
import Chat from './components/Chat.jsx'; 
import { useState, useEffect } from 'react'; 
import { collection, addDoc, serverTimestamp, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid'; // npm install uuid
import { query, orderBy } from "firebase/firestore";
import { auth, provider, signInWithPopup, signOut, db } from './firebase';
import { GoogleGenerativeAI } from "@google/generative-ai";
import {MODEL_OPTIONS, fetchModelResponse, getTitleFromBot} from './models'; // Ensure you have this file with model options
import Link from 'next/link';
import FileUploadModal from './components/FileUploadModel';


export const DropDownModels = ({ models, onSelect}) => {
  return (
     <div className="modelsDropDown">
      {
      models.map((model) => (
         <div className={`modelsDropDown-inside ${model.api === '' ? 'disabled' : ''}`}>
        <p className={`${model.api === '' ? 'disabled' : ''}`} key={model.id} onClick={() => {
          if (model.api !== '') {
          onSelect(model);
          }
          }}>
          {model.label}
        </p>

        <div className = "model-options">
           {model.ispdf && <Book/>}
           {model.isimg && <Eye/> }
           {model.issearch && <Globe/>}
           {model.isreason && <Brain/>}
           </div>
           </div>
      ))}
    </div>
  );
};

export default function Home() {
  const [user, setUser] = useState(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [threads, setThreads] = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  //const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [model, setModel] = useState(MODEL_OPTIONS[0]);
  const [isModelSelect, setisModelSelect] = useState(false)
  const [modelOptions, setModelOptions] = useState([]);

  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
  const [load, setLoad] = useState(false);
  const [error, setError] = useState('');
  const [context, setContext] = useState({})

  // Keep or secure via .env

  // useEffect(() => {
  //   const unsubscribe = auth.onAuthStateChanged(setUser);
  //   return () => unsubscribe();
  // }, []);
   useEffect(() => {
  const fetchModels = async () => {
    try {
      const snap = await getDocs(collection(db, "models"));
      const options = snap.docs.map(doc => ({
        id: doc.data().id,
        label: doc.data().label,
        provider: doc.data().provider,
        api : doc.data().apiKey,
        isimg : doc.data().isimg,
        ispdf : doc.data().ispdf,
        issearch: doc.data().issearch,
        isreason: doc.data().isreason
      }));
      setModelOptions(options);
      console.log(modelOptions)
      if (options.length > 0) setModel(options[0]); // set default
    } catch (e) {
      console.error("Error loading models:", e);
    }
  };

  const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
    if (firebaseUser) {
      setUser({
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        email: firebaseUser.email
      });
      await loadThreads(firebaseUser.uid);
    } else {
      setUser(null);
    }
  });

  fetchModels(); // <- moved outside the auth listener

  return () => unsubscribe();
}, []);

    const loadThreads = async (uid) => {
      try {
        const threadsRef = collection(db, "users", uid, "threads");

        // Query: order by createdAt descending
        const q = query(threadsRef, orderBy("createdAt", "desc"));

        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setThreads(data);
      } catch (e) {
        console.error("Error loading threads:", e);
      }
    };

    const loadMessages = async (threadId) => {
      if (!user) return;

      cleanupTempThread();

      const messagesRef = collection(db, "users", user.uid, "threads", threadId, "messages");
      const q = query(messagesRef, orderBy("createdAt"));
      const msgSnap = await getDocs(q);
      const msgs = msgSnap.docs.map(doc => doc.data());
      setMessages(msgs);
      setCurrentThreadId(threadId);
    };

    // const handleNewChat = async () => {
    //   if (!user) return;
    //   const threadId = uuidv4();
    //   const threadRef = doc(db, "users", user.uid, "threads", threadId);
    //   await setDoc(threadRef, { createdAt: serverTimestamp(), name: `Chat ${threads.length + 1}` });
    //   setCurrentThreadId(threadId);
    //   setMessages([]);
    //   loadThreads(user.uid);
    // };

    const handleNewChat = async () => {
      if (!user) return;

      // Auto-remove unsaved thread before starting a new one
      cleanupTempThread();

      const threadId = uuidv4();
      const tempThread = {
        id: threadId,
        name: `New Chat`,
        isTemp: true
      };

      setThreads(prev => [tempThread, ...prev]);
      setCurrentThreadId(threadId);
      setMessages([]);
    };

    const cleanupTempThread = () => {
      setThreads(prevThreads => prevThreads.filter(t => !(t.id === currentThreadId && t.isTemp)));
    };


    // const handleLogin = async () => {
    //   try {
    //     const result = await signInWithPopup(auth, provider);
    //     setUser(result.user);
    //   } catch (err) {
    //     console.error("Login error:", err);
    //   }
    // };

    

    const handleLogin = async () => {
      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Save full user object
        setUser({
          uid: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL,
          email: user.email
        });
      } catch (err) {
        console.error("Login error:", err);
      }
    };

    const handleLogout = () => {
      signOut(auth);
      setUser(null);
      setMessages([]);
      setThreads([]);
      setCurrentThreadId(null);
    };
// import { GoogleGenerativeAI } from "@google/generative-ai";
    async function generateResponse(prompt) {
      if (!currentThreadId || !user) return;

      // console.log(model)
      // console.log(messages)
      const isAlreadySaved = threads.find(t => t.id === currentThreadId && !t.isTemp);
      let new_title = "New Chat"
      if (!isAlreadySaved){
        new_title = await getTitleFromBot({
          modelId : model.id,
          provider : model.provider,
          prompt,
          api: model.api,
        })
      }

      console.log(new_title)

      const text = await fetchModelResponse({
        modelId: model.id,
        provider: model.provider,
        prompt,
        messages,
        api: model.api,
        fileContext: context
      });
    
      

      const newMessages = [
        { isUser: true, message: prompt },
        { isUser: false, message: text }
      ];

      setMessages(prev => [...prev, ...newMessages]);
      setInput("");

      try {
        const threadPath = ["users", user.uid, "threads", currentThreadId];
        const threadRef = doc(db, ...threadPath);

        // Check if this is a temporary thread
        //const isAlreadySaved = threads.find(t => t.id === currentThreadId && !t.isTemp);

        if (!isAlreadySaved) {
          await setDoc(threadRef, {
            createdAt: serverTimestamp(),
            name: new_title
          });
          // Update thread state to reflect it's now saved
            setThreads(prevThreads =>
            prevThreads.map(t =>
              t.id === currentThreadId
                ? { ...t, name: new_title, isTemp: false }
                : t
            )
          );

          await loadThreads(user.uid);
        }

        // Save messages
        await Promise.all(newMessages.map(msg =>
          addDoc(collection(db, ...threadPath, "messages"), {
            isUser: msg.isUser,
            message: msg.message,
            createdAt: serverTimestamp()
          })
        ));
      } catch (e) {
        console.error("Firestore write error:", e);
      }
    }



  const handleFileUpload = async (file, query) => {
  setLoad(true);
  setError('');
  console.log('Uploading file:', file);
  
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    console.log('Making POST request to /api/upload');
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    const result = await response.json();
    //const newContext = {"type":result.fileType,"data":result.data };
    setContext(result);
    //console.log('New context:', context);

    
  } catch (error) {
    console.error('Upload error:', error);
    setError('Upload failed: ' + error.message);
  } finally {
    setLoad(false);
  }

};
  // try {
  //   const formData = new FormData();
  //   formData.append('file', file);
  //   formData.append('query', query);
    
  //   console.log('FormData created, sending request...');
    
  //   const res = await fetch('/api/process-file', {
  //     method: 'POST',
  //     body: formData,
  //   });
    
  //   console.log('Response status:', res.status);
    
  //   if (!res.ok) {
  //     const errorText = await res.text();
  //     console.error('Server error response:', errorText);
  //     throw new Error(`Server error: ${res.status} - ${errorText}`);
  //   }
    
  //   const data = await res.json();
  //   // ... rest of your code
  // } catch (err) {
  //   console.error('Upload error:', err);
  //   // ... rest of error handling
  // }


//   return (
//     <main>
//       <div className="App">
//       <div className="sidebar">
//         <div className="upperSide">
//           <div className="upperSideTop">
//             <Watemark />
//             <button className="midBtn" onClick={handleNewChat}>new chat</button>
//           </div>
//           <div className="upperSideBottom">
//             <div className="searchBar text-dark">
//               <Lens />
//               <input type="text" placeholder='Search' />
//             </div>
//             <div className="chatList">
//                {threads.map(thread => (
//                 <Thread key={thread.id} thread={thread} onSelect={(threadId)=>{setInput(""); loadMessages(threadId)}} isSelected={thread.id === currentThreadId} />
//               ))}
//             </div>
//           </div>
//         </div>
//         <div className="lowerSide">
//   {user ? (
//     <Link href="/keys" style={{ all: 'unset', cursor: 'pointer' }}>
//       <div className="user-profile-link">
//         <img src={user.photoURL} alt="Profile" className="user-avatar" />
//         <span>{user.displayName}</span>
//       </div>
//     </Link>
//   ) : (
//     <span className="login" onClick={handleLogin}>
//       <Login /> Login
//     </span>
//   )}
// </div>
//       </div>
//       <div className="main">
//         <div className = "mainContainer">        
//           <div className="chats">
//           {messages.map((msg, i) => (
//             <Chat key={i} isUser={msg.isUser} message={msg.message} />
//           ))}
//         </div>
//         <div className="chatFooter">
//           <div className="inp text-dark">
//             <input
//               type="text"
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               onKeyDown={async (e) => {
//                 if (e.key === 'Enter') generateResponse(input);
//               }}
//               placeholder="Type a message"
//             />
//             <div className='chat-settings'>
//               <div className="chat-tools">
//                 <div className ="search-models" onClick={(e) => {setisModelSelect(!isModelSelect)}}>
//                <span
//                   className=""
                  
//                 >
//                   {model.label} 
//                 </span>
//                 <Drop/>

//                 {isModelSelect && <DropDownModels models={modelOptions} onSelect={(model) => {
                
//                 setModel(model);     // update model in parent
//                 setisModelSelect(false);     // optionally close dropdown
//                 }} />}

//                </div>
//                 <button className='chat-search tools'> <Search /> search</button>
//                 <button className='attach-file tools'><Attach /></button>
//               </div>
//               <button className='send-btn' onClick={() => generateResponse(input)} disabled={!input.trim()}>
//                 <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34"
//                   viewBox="0 0 24 24" fill="none" stroke="currentColor"
//                   strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="send">
//                   <path d="m5 12 7-7 7 7"></path>
//                   <path d="M12 19V5"></path>
//                 </svg>
//               </button>
//             </div>
//           </div>
//           </div>
//         </div>
//       </div>
//     </div>
//     </main>
//   );

return (
    <main>
      <div className="App">
        <div className="sidebar">
          <div className="upperSide">
            <div className="upperSideTop">
              <Watemark />
              <button className="midBtn" onClick={handleNewChat}>new chat</button>
            </div>
            <div className="upperSideBottom">
              <div className="searchBar text-dark">
                <Lens />
                <input type="text" placeholder='Search' />
              </div>
              <div className="chatList">
                {threads.map(thread => (
                  <Thread 
                    key={thread.id} 
                    thread={thread} 
                    onSelect={(threadId) => {
                      setInput(""); 
                      loadMessages(threadId)
                    }} 
                    isSelected={thread.id === currentThreadId} 
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="lowerSide">
            {user ? (
              <Link href="/keys" style={{ all: 'unset', cursor: 'pointer' }}>
                <div className="user-profile-link">
                  <img src={user.photoURL} alt="Profile" className="user-avatar" />
                  <span>{user.displayName}</span>
                </div>
              </Link>
            ) : (
              <span className="login" onClick={handleLogin}>
                <Login /> Login
              </span>
            )}
          </div>
        </div>
        
        <div className="main">
          <div className="mainContainer">
            <div className="chats">
              {messages.map((msg, i) => (
                <Chat key={i} isUser={msg.isUser} message={msg.message} />
              ))}
            </div>
            <div className="chatFooter">
              <div className="inp text-dark">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') generateResponse(input);
                  }}
                  placeholder="Type a message"
                />
                <div className='chat-settings'>
                  <div className="chat-tools">
                    <div className="search-models" onClick={(e) => {setisModelSelect(!isModelSelect)}}>
                      <span className="">
                        {model.label}
                      </span>
                      <Drop/>
                      {isModelSelect && 
                        <DropDownModels 
                          models={modelOptions} 
                          onSelect={(model) => {
                            setModel(model);
                            setisModelSelect(false);
                          }} 
                        />
                      }
                    </div>
                    <button className='chat-search tools'> 
                      <Search /> search
                    </button>
                    <button 
                      className='attach-file tools'
                      onClick={() => setIsFileUploadOpen(true)}
                    >
                      <Attach />
                    </button>
                  </div>
                  <button 
                    className='send-btn' 
                    onClick={() => generateResponse(input)} 
                    disabled={!input.trim() || load}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="send">
                      <path d="m5 12 7-7 7 7"></path>
                      <path d="M12 19V5"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={isFileUploadOpen}
        onClose={() => setIsFileUploadOpen(false)}
        onFileUpload={handleFileUpload}
        
        load={load}
        
      />
    </main>
  );
}

