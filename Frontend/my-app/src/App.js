import Landingpages from "./pages/landing.jsx";
import './App.css';
import {Route,BrowserRouter as Router , Routes} from 'react-router-dom'
import Authentication from "./pages/authentication.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import VideoMeetComponent from "./pages/VideoMeet.jsx";

function App() {
  return (
   <div className="App">
    <Router>
      <AuthProvider>
      <Routes>
        <Route path='/' element={<Landingpages/>} />
        <Route path='/auth' element={<Authentication/>} />
        <Route path="/:url" element ={<VideoMeetComponent/>} />
      </Routes>
      </AuthProvider>
    </Router>
    </div>
  );
}

export default App;
