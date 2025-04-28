import './App.css';


import { useEffect } from 'react';

import { Routes, Route, Router } from 'react-router';
import { Navigate } from 'react-router';
import Login from './component/Login'
import UserInterface from './component/user/UserInterface';
import Home from './component/user/pages/Home';
import Upload from './component/user/pages/Upload';
import Search from './component/user/pages/Search';
import Permission from './component/user/pages/Permission';
// import GraphAnalysisComponent from './component/GraphAnalysis/GraphAnalysisComponent';
import Register from './component/Register';
import Graphe_analysis from './component/GraphAnalysis/graphe_analysis';
import './i18n'
function App() {
    console.log("dddd");
    useEffect(()=>{
      console.log("useEffect");
    })
    const isAuthenticated = !!localStorage.getItem('authToken');
    return( 
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={isAuthenticated ? <UserInterface /> : <Navigate to="/" replace />}>
              <Route index element={<Home />} />
              <Route path="upload" element={<Upload />} />
              <Route path="search" element={<Search />} />
              <Route path="permission" element={<Permission />} />
              <Route path="analytics/AlgorithmicAnalysis" element={<Graphe_analysis />} /> 
          </Route>
        </Routes>
      
      /*<BrowserRouter>
        <Link to="/" >Home</Link>
        <Link to="/login" style={{marginLeft:"12px"}}>Login</Link>
        <Link to="/details" style={{marginLeft:"12px"}}>Details</Link>
        <Link to="/about" style={{marginLeft:"12px"}}>About</Link>
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/details" element={<Details/>}/>
          <Route path="/about" element={<About/>}/>
          <Route path="/login" element={<Login/>}/>
        </Routes>
      </BrowserRouter>*/
    )
}
export default App;