"use strict";


(function () {

    function CheckLogin(){
        console.log("[INFO] Checking user login status");

        const loginNav = document.getElementById("login");

        if(!loginNav){
            console.warn("[WARNING] loginNav element not found. skipping CheckLogin().")
            return;
        }

        const  userSession = sessionStorage.getItem("user");

        if(userSession){

            loginNav.innerHTML = `<i class="fas fa-sign-out-alt">Logout</i>`;
            loginNav.href = "#";
            loginNav.addEventListener("click", (event)=> {
                event.preventDefault();
                sessionStorage.removeItem("user");
                location.href = "login.html";
            })
        }
    }
    function updateActiveNavLink(){
        console.log("[INFO] updateActiveNavLink called.....");

        const currentPage = document.title.trim();
        const navLinks = document.querySelectorAll("nav a");

        navLinks.forEach(link => {

            if(link.textContent.trim() === currentPage){
                link.classList.add("active");
            }else {
                link.classList.remove("active");
            }
        })
    }

    /**
     * Loads the navbar into the current page
     * @returns {Promise<void>}
     */
    async function LoadHeader(){
        console.log("[INFO]  LoadHeader called...");

        return fetch("header.html")
            .then(response => response.text())
            .then(data => {
                document.querySelector("header").innerHTML = data;
                updateActiveNavLink();
            })
            .catch(error => console.log("[ERROR] unable to load header"));

    }

    function DisplayLoginPage(){
        console.log("[INFO] DisplayLoginPage called....");

        const messageArea = document.getElementById("messageArea");
        const loginButton = document.getElementById("submitButton");
        const cancelButton = document.getElementById("cancelButton");

        // Hide message area initially
        messageArea.style.display = "none";

        if(!loginButton){
            console.error("[ERROR] loginButton not found in the DOM");
            return;
        }

        loginButton.addEventListener("click", async (event)=>{
            event.preventDefault();

            const username = document.getElementById("username").value.trim();
            const password = document.getElementById("password").value.trim();

            try{

                const response = await fetch("data/users.json");
                if(!response.ok){
                    throw new Error(`[ERROR] HTTP error!. Status: ${response.status}`);
                }

                const jsonData = await response.json();
                //console.log("[DEBUG] JSON data", jsonData)

                const users = jsonData.users;
                if(!Array.isArray(users)){
                    throw new Error("[ERROR] JSON data does not contain valid array")
                }

                let success = false;
                let authenticatedUser = null;

                for(const user of users){
                    if(user.Username === username && user.Password === password){
                        success = true;
                        authenticatedUser = user;
                        break;
                    }
                }

                if(success){

                    sessionStorage.setItem("user", JSON.stringify({
                        DisplayName: authenticatedUser.DisplayName,
                        EmailAddress: authenticatedUser.EmailAddress,
                        Username: authenticatedUser.Username
                    }));

                    messageArea.style.display = "none";
                    messageArea.classList.remove("alert-danger");
                    location.href = "contact-list.html";
                } else {
                    messageArea.style.display = "block";
                    messageArea.classList.add("aller", "alert-danger");
                    messageArea.textContent = "Invalid Username or password, Please try again";

                    document.getElementById("username").focus();
                    document.getElementById("username").select();

                }
            }catch(error){
                console.error("[ERROR] Login failed", error);
            }
        });

        cancelButton.addEventListener("click", (event)=>{

            document.getElementById("loginForm").reset();
            location.href = "index.html";
        })

    }

    /**
     * Loads the register page
     *
     */
    function DisplayRegisterPage(){
        console.log("[INFO] DisplayRegisterPage called....");
    }


    /**
     * Creates new contacts
     * @param fullName the full name of the contact
     * @param contactNumber the phone number of the contact
     * @param emailAddress the email address of the contact
     *
     */
    function AddContact(fullName, contactNumber, emailAddress) {
        let contact = new core.Contact(fullName, contactNumber, emailAddress);
        if(contact.serialize()){
            let key = `contact_${Date.now()}`
            localStorage.setItem(key, contact.serialize());
        }
    }

    /**
     * loads the edit page and updates the list when the values on the input are updated
     *
     */
    function DisplayEditPage(){
        console.log("Called DisplayEditPage() .....");

        const page = location.hash.substring(1);

        switch(page){
            case "add":
            {
                // Add a new contact
                const heading = document.querySelector("main>h1");
                const  editButton = document.getElementById("editButton");
                const cancelButton = document.getElementById("cancelButton");

                // Update Styling
                document.title = "Add Contact";

                if(heading){
                    heading.textContent = "Add Contact";
                }

                if(editButton){
                    editButton.innerHTML = `<i class="fa-solid fa-user-plus"></i> Add Contact`;

                    editButton.addEventListener("click", (event)=> {

                        // Prevent form Submission
                        event.preventDefault();

                        AddContact(
                            document.getElementById("fullName").value,
                            document.getElementById("contactNumber").value,
                            document.getElementById("emailAddress").value
                        );
                        location.href="contact-list.html";

                    });
                }
                if(cancelButton){
                    cancelButton.addEventListener("click", (event)=> {

                        location.href="contact-list.html";
                    })
                }
                break;
            }
            default:
            {
                // Edit an existing contact
                const contact = new core.Contact();
                const contactData = localStorage.getItem(page);

                if(contactData){
                    contact.deserialize(contactData);
                }

                //prepopulate the form with current values
                document.getElementById("fullName").value = contact.fullName;
                document.getElementById("contactNumber").value = contact.contactNumber;
                document.getElementById("emailAddress").value = contact.emailAddress;

                const  editButton = document.getElementById("editButton");
                const cancelButton = document.getElementById("cancelButton");

                if(editButton){
                    editButton.addEventListener("click", (event)=> {
                        //Prevent default form submission
                        event.preventDefault();

                        contact.fullName = document.getElementById("fullName").value;
                        contact.emailAddress = document.getElementById("emailAddress").value;
                        contact.contactNumber = document.getElementById("contactNumber").value;

                        //update -overwrite contact
                        localStorage.setItem(page, contact.serialize());

                        location.href="contact-list.html";

                    })
                }
                if(cancelButton){
                    cancelButton.addEventListener("click", (event)=> {

                        location.href="contact-list.html";
                    })
                }
                break;
            }
        }


    }

    async function DisplayWeather(){

        const apiKey = "aed8a2ea573812f57f424e31770b7114";
        const city = "Oshawa";
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

        try{
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error("Failed to fetch weather data");
            }
            const data = await response.json();
            console.log(data);

            const weatherDataElement = document.getElementById('weather-data');
            weatherDataElement.innerHTML = `<strong>City:</strong> ${data.name}<br>
                                            <strong>Temperature:</strong> ${data.main.temp}°C<br>
                                             <strong>Weather:</strong> ${data.weather[0].description}`;


        }catch(error){
            console.error(`Error calling openweathermap for weather`);
            document.getElementById("weather-data").textContent = "Unable to fetch weather data at this time";
        }
    }


    function DisplayContactListPage() {
        console.log("DisplayContactListPage");

        if (localStorage.length > 0) {
            let contactList = document.getElementById("contactList");
            let data = "";

            let index = 1;

            let keys = Object.keys(localStorage);
            //console.log(keys);

            for (const key of keys) {
                if (key.startsWith("contact_")) {
                    let contactData = localStorage.getItem(key);

                    try {
                        //console.log(contactData);
                        let contact = new core.Contact();
                        contact.deserialize(contactData); // re-construct the contact object
                        data += `<tr>
                                    <th scope="row" class="text-center">${index}</th>
                                    <td>${contact.fullName}</td>
                                    <td>${contact.contactNumber}</td>
                                    <td>${contact.emailAddress}</td>
                                    <td class="text-center">
                                        <button value="${key}" class="btn btn-warning btn-sm edit">
                                            <i class="fa-solid fa-pen-to-square"></i>
                                            Edit
                                        </button>
                                    </td>
                                    <td class="text-center">
                                        <button value="${key}" class="btn btn-danger btn-sm delete">
                                            <i class="fa-solid fa-trash"></i>
                                            Delete
                                        </button>
                                    </td>
                                  </tr>`;

                        index++;
                    } catch (error) {
                        console.error("Error deserializing contact data");
                    }
                } else {
                    console.warn(`Skipping non-contact key: ${key}`);
                }
            }
            contactList.innerHTML = data;

        }

        const addButton = document.getElementById("addButton");
        addButton.addEventListener("click", () => {
            location.href = "edit.html#add";
        });


        const deleteButton = document.querySelectorAll("button.delete");
        deleteButton.forEach((button) => {

            button.addEventListener("click", function() {

                if (confirm("Delete contact, please confirm")) {
                    localStorage.removeItem(this.value)
                    location.href = "contact-list.html";
                }
            });
        });
        const editButton = document.querySelectorAll("button.edit");
        editButton.forEach((button) => {

            button.addEventListener("click", function() {
                location.href = "edit.html#" + this.value;
            });
        });
    }

    function DisplayHomePage() {
        console.log("Calling DisplayHomePage...");

        let aboutUsButton = document.getElementById("AboutusBtn");
        aboutUsButton.addEventListener("click",  (event)=> {
            location.href = "about.html";
        });

        DisplayWeather();

        document.querySelector("main").insertAdjacentHTML(
            'beforeend',
            `<p id="MainParagraph" class="mt-3">This is my first main paragraph</p>`
        )

        document.body.insertAdjacentHTML(
            'beforeend',
            `<article class="container">
                    <p id="ArticleParagraph" class="mt-3">This is my first article paragraph</p>
                  </article>`
        )
    }

    function DisplayProductsPage() {
        console.log("Calling DisplayProductsPage...");
    }
    function DisplaySerivcesPage() {
        console.log("Calling DisplaySerivcesPage...");
    }
    function DisplayAboutPage() {
        console.log("Calling DisplayAboutPage...");
    }
    function DisplayContactPage() {
        console.log("Calling DisplayContactPage...");

        let sendButton = document.getElementById("sendButton");
        let subscribeCheckbox = document.getElementById("subscribeCheckbox");

        sendButton.addEventListener("click", function () {
            if(subscribeCheckbox.checked) {
                let contact = new core.Contact(fullName.value, contactNumber.value, emailAddress.value);
                if(contact.serialize()){
                    let key = `contact_${Date.now()}`
                    localStorage.setItem(key, contact.serialize());
                }
            }
        })
    }

    function Start() {
        console.log("Starting App...");
        console.log(`Current document title: ${document.title}`);

        // Load header first then run CheckLogin
        LoadHeader().then(()=> {
            CheckLogin();
        });
        switch (document.title){
            case "Home":
                DisplayHomePage();
                break;
            case "Products":
                DisplayProductsPage();
                break;
            case "Services":
                DisplaySerivcesPage();
                break;
            case "About":
                DisplayAboutPage();
                break;
            case "Contact":
                DisplayContactPage();
                break;
            case "Contact List":
                DisplayContactListPage();
                break;
            case "Edit Contact":
                DisplayEditPage();
                break;
            case "Login":
                DisplayLoginPage();
                break;
            case "Register":
                DisplayRegisterPage();
                break;
            default:
                console.error("No matching case for page title");
        }
    }
    window.addEventListener("DOMContentLoaded", ()=>{
        console.log("DOM fully loaded and parsed");
        Start();
    });

})()