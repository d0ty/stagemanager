import Layout from "./Layout.jsx";

import Chat from "./Chat";

import Dashboard from "./Dashboard";

import Home from "./Home";

import Inventory from "./Inventory";

import LightTech from "./LightTech";

import ProgramDetails from "./ProgramDetails";

import RunMentionGenerator from "./RunMentionGenerator";

import SoundTech from "./SoundTech";

import Staff from "./Staff";

import Tasks from "./Tasks";

import Programs from "./Programs";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Chat: Chat,
    
    Dashboard: Dashboard,
    
    Home: Home,
    
    Inventory: Inventory,
    
    LightTech: LightTech,
    
    ProgramDetails: ProgramDetails,
    
    RunMentionGenerator: RunMentionGenerator,
    
    SoundTech: SoundTech,
    
    Staff: Staff,
    
    Tasks: Tasks,
    
    Programs: Programs,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Chat />} />
                
                
                <Route path="/Chat" element={<Chat />} />
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Inventory" element={<Inventory />} />
                
                <Route path="/LightTech" element={<LightTech />} />
                
                <Route path="/ProgramDetails" element={<ProgramDetails />} />
                
                <Route path="/RunMentionGenerator" element={<RunMentionGenerator />} />
                
                <Route path="/SoundTech" element={<SoundTech />} />
                
                <Route path="/Staff" element={<Staff />} />
                
                <Route path="/Tasks" element={<Tasks />} />
                
                <Route path="/Programs" element={<Programs />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}