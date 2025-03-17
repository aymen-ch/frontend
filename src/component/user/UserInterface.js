import { Outlet } from "react-router";
import Sidebar from "./pages/Sidebar";
import Navbars from "./pages/bar";

export default function UserInterface() {
    return (
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {/* Navbar */}
            <Navbars/>

                {/* Main Content (Sidebar + Outlet) */}
                    <div style={{ display: "flex", flexGrow: 1 }}>
                        {/* Sidebar */}
                            <div>
                            <Sidebar />
                            </div>

                            {/* Outlet */}
                            <div
                                className="container-fluid flex-grow-1 overflow-auto"
                                style={{
                                    maxHeight: "100%",
                                    padding:"0px"
                                }}
                                >
                                <Outlet />
                            </div>
                    </div>

                 {/* Footer 
                <footer
                    style={{
                    color: "#fff",
                    textAlign: "center",
                    padding: "10px",
                    backgroundColor: "#117a65",
                    }}
                >
                Développée par le centre de recherche et développemnt de la Gendarmerie Nationale
            </footer>*/}
        </div>
    );
}

