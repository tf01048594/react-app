import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    fetch("http://localhost:3000/api/hello")
      .then((response) => response.json())
      .then((data) => {
        setMessage(data.message);
      })
      .catch((error) => {
        console.error(error);
        setMessage("Failed to connect to backend");
      });
  }, []);

  return (
    <div>
      <h1>Internal Wiki</h1>
      <p>{message}</p>
    </div>
  );
}

export default App;