"use strict";

/**
 * Loads the navbar into the current page
 * @returns {Promise<void>}
 */
export function LoadHeader(){
    console.log("[INFO]  LoadHeader called...");

    return fetch("views/components/header.html")
        .then(response => response.text())
        .then(data => {
            document.querySelector("header").innerHTML = data;
            updateActiveNavLink();
            CheckLogin();
        })
        .catch(error => console.log("[ERROR] unable to load header"));

}

/**
 * To update the navlink to determine the current page
 */
export function updateActiveNavLink(){
    console.log("[INFO] updateActiveNavLink called.....");

    const currentPath = location.hash.slice(1) || "/";
    const navLinks = document.querySelectorAll("nav a");

    navLinks.forEach(link => {

        const linkPath = link.getAttribute("href").replace("#", "");
        if(currentPath === linkPath){
            link.classList.add("active");
        }else {
            link.classList.remove("active");
        }
    })
}

function handleLogout(event){
    event.preventDefault();
    sessionStorage.removeItem("user");
    console.log("[INFO] User logged out. Update UI...");

    LoadHeader().then(()=> {
        location.hash = "/";
    })
}
/**
 * Checks if the user is logged in already to update the nav link to log out
 *
 */
function CheckLogin(){
    console.log("[INFO] Checking user login status");

    const loginNav = document.getElementById("login");

    if(!loginNav){
        console.warn("[WARNING] loginNav element not found. skipping CheckLogin().")
        return;
    }

    const  userSession = sessionStorage.getItem("user");

    if(userSession){

        loginNav.innerHTML = `<i class="fas fa-sign-out-alt"></i> Logout`;
        loginNav.href = "#";
        loginNav.removeEventListener("click", handleLogout);
        loginNav.addEventListener("click", handleLogout);
    }else{
        loginNav.innerHTML = `<i class="fas fa-sign-out-alt"></i> Login`;
        loginNav.removeEventListener("click", handleLogout);
        loginNav.addEventListener("click", ()=> location.hash ="/login" );
    }
}