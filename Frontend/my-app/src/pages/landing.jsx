import '../App.css';
import React from 'react';
import {Link} from 'react-router-dom';
export default function Landingpages() {
    return (
        <div className='landingPageContainer'>
            <nav>
                <div className='navHeader'>
                    <h2>Apna Video Call</h2>
                </div>
                <div className='navlist'>
                    <p>Join as Guest</p>
                    <p>Register</p>
                    <div role='button'>login</div>
                </div>
            </nav>
            <div className="landingMainContainer">
                <div>
                    <h1><span style={{color : "#FF9839"}}>Connect</span> with your loved ones</h1>
                    <p>Cover a distance by Apna Video Call</p>
                    <div role='button'><Link to={"/auth"}>Get Started</Link> 
                    </div>
                </div>
                <div>
                    <img src='mobile.png' alt=''/>
                </div>
            </div>
        </div>
    );
}

