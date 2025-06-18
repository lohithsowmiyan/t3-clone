'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase'; // adjust if your path is different
import './keys.css'

export default function ApiKeyPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [providers, setProviders] = useState([]);
  const [apiKeys, setApiKeys] = useState({});
  const [initialKeys, setInitialKeys] = useState({});
  const [editing, setEditing] = useState({});
  const [loading, setLoading] = useState(false);



  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (!firebaseUser) {
        router.push('/'); // redirect to home if not logged in
      } else {
        setUser(firebaseUser);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Load unique providers from Firestore
  useEffect(() => {
    const fetchProviders = async () => {
      const snap = await getDocs(collection(db, "models"));
      const models = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const uniqueProviders = Array.from(new Set(models.map(m => m.provider)));

      const keyMap = {};
      uniqueProviders.forEach(provider => {
        const model = models.find(m => m.provider === provider && m.apiKey);
        keyMap[provider] = model?.apiKey || '';
      });

      setInitialKeys(keyMap);
      setApiKeys(keyMap);
      setProviders(uniqueProviders);
    };

    fetchProviders();
  }, []);

  const handleChange = (provider, value) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }));
  };

  const handleEdit = (provider) => {
    setApiKeys(prev => ({ ...prev, [provider]: '' }));
    setEditing(prev => ({ ...prev, [provider]: true }));
  };

  const handleSaveAll = async () => {
    setLoading(true);
    try {
      await Promise.all(
        providers.map(async (provider) => {
          const key = apiKeys[provider];
          if (!key || key === initialKeys[provider]) return;

          const q = query(collection(db, "models"), where("provider", "==", provider));
          const snap = await getDocs(q);

          await Promise.all(snap.docs.map(docSnap =>
            updateDoc(doc(db, "models", docSnap.id), {
              apiKey: key
            })
          ));
        })
      );
      alert("All changes saved.");
    } catch (e) {
      console.error("Error saving:", e);
      alert("Failed to update keys.");
    }
    setLoading(false);
  };

  const goBack = () => {
    router.push("/");
  };


  if (!user) return null; // don't show anything until user is loaded

  return (
    <main>
    <div className = "container">
      <div className = 'left-side'>
       <button onClick={goBack} className='back-button'>
        ← Back to Home
      </button>
      <div className = "user-info">
        <img src={user.photoURL} alt="Profile" width={300}  height={200} style={{ borderRadius: '50%' }}   // set desired width
   />
        <p>{user.displayName}</p>
        <p>{user.email}</p>
      </div>
    </div>
      
      <div className="right-side">
      <h2>Model Provider API Key Manager</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>Provider</th>
            <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>API Key</th>
          </tr>
        </thead>
        <tbody>
          {providers.map((provider) => (
            <tr key={provider}>
              <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>{provider}</td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "0.5rem",
                  position: "relative"
                }}
                onMouseEnter={() => setEditing(prev => ({ ...prev, [`hover_${provider}`]: true }))}
                onMouseLeave={() => setEditing(prev => ({ ...prev, [`hover_${provider}`]: false }))}
              >
                {!apiKeys[provider] ? (
                  <input
                    type="text"
                    value={apiKeys[provider]}
                    onChange={(e) => handleChange(provider, e.target.value)}
                    style={{ width: "100%" }}
                  />
                ) : (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>************</span>
                    {editing[`hover_${provider}`] && (
                      <button
                        onClick={() => handleEdit(provider)}
                        style={{
                          marginLeft: "1rem",
                          background: "#eee",
                          border: "1px solid #aaa",
                          cursor: "pointer",
                          fontSize: "0.8rem"
                        }}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className='send-btn'>
        <button onClick={handleSaveAll} disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
    </div>
    </main>
  );
}
