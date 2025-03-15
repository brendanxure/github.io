"use strict";


import { LoadHeader } from "./header.js";
import { Router } from "./router.js";
import { LoadFooter } from "./footer.js";
import { AuthGuard } from "./authguard.js";

const routes = {
    "/": "views/pages/home.html",
    "/about": "views/pages/about.html",
    "/products": "views/pages/products.html",
    "/services": "views/pages/services.html",
    "/contact": "views/pages/contact.html",
    "/contact-list": "views/pages/contact-list.html",
    "/edit": "views/pages/edit.html",
    "/login": "views/pages/login.html",
    "/register": "views/pages/register.html",
    "/404": "views/pages/404.html"
}

const pageTitle = {
    "/": "Home",
    "/home": "Home",
    "/about": "About Us",
    "/products": "Products",
    "/services": "Services",
    "/contact": "Contact",
    "/contact-list": "Contact List",
    "/edit": "Edit Contact",
    "/login": "Login",
    "/register": "Register",
    "/404": "Page Not Found",
}
const router = new Router(routes);
(function () {


    /**
     * Loads the login page
     */
    function DisplayLoginPage() {
        console.log("[INFO] DisplayLoginPage called....");

        if (sessionStorage.getItem("user")) {
            router.navigate("/contact-list");
            return;
        }

        const messageArea = document.getElementById("messageArea");
        const loginButton = document.getElementById("submitButton");
        const cancelButton = document.getElementById("cancelButton");

        // Hide message area initially
        messageArea.style.display = "none";

        if (!loginButton) {
            console.error("[ERROR] loginButton not found in the DOM");
            return;
        }

        loginButton.addEventListener("click", async (event) => {
            event.preventDefault();

            const username = document.getElementById("username").value.trim();
            const password = document.getElementById("password").value.trim();

            try {

                const response = await fetch("data/users.json");
                if (!response.ok) {
                    throw new Error(`[ERROR] HTTP error!. Status: ${response.status}`);
                }

                const jsonData = await response.json();
                //console.log("[DEBUG] JSON data", jsonData)

                const users = jsonData.users;
                if (!Array.isArray(users)) {
                    throw new Error("[ERROR] JSON data does not contain valid array")
                }

                let success = false;
                let authenticatedUser = null;

                for (const user of users) {
                    if (user.Username === username && user.Password === password) {
                        success = true;
                        authenticatedUser = user;
                        break;
                    }
                }

                if (success) {

                    sessionStorage.setItem("user", JSON.stringify({
                        DisplayName: authenticatedUser?.DisplayName,
                        EmailAddress: authenticatedUser?.EmailAddress,
                        Username: authenticatedUser?.Username
                    }));

                    messageArea.style.display = "none";
                    messageArea.classList.remove("alert-danger");

                    LoadHeader().then(() => {
                        router.navigate("/contact-list");
                    })
                } else {
                    messageArea.style.display = "block";
                    messageArea.classList.add("aller", "alert-danger");
                    messageArea.textContent = "Invalid Username or password, Please try again";

                    document.getElementById("username").focus();
                    document.getElementById("username").select();

                }
            } catch (error) {
                console.error("[ERROR] Login failed", error);
            }
        });

        cancelButton.addEventListener("click", (event) => {

            document.getElementById("loginForm").reset();
            router.navigate("/");
        })

    }

    /**
     * Loads the register page
     *
     */
    function DisplayRegisterPage() {
        console.log("[INFO] DisplayRegisterPage called....");
    }


    /**
     * Redirect the user back to contact-list.html
     */
    function handleCancelClick() {
        router.navigate("/contact-list");
    }

    /**
     * Handle the process of editing an existing contact
     * @param event
     * @param contact
     * @param page
     */
    function handleEditClick(event, contact, page) {
        // prevent default form submission
        event.preventDefault();
        console.log("[INFO] Edit button clicked");

        if (!validateForm()) {
            alert("Invalid data! Please check your inputs");
            return;
        }
        console.log("[INFO] Form validation passed");

        // Retrieve update values from the form fields
        const fullName = document.getElementById("fullName").value;
        const contactNumber = document.getElementById("contactNumber").value;
        const emailAddress = document.getElementById("emailAddress").value;

        // Update the contact information
        contact.fullName = fullName;
        contact.contactNumber = contactNumber;
        contact.emailAddress = emailAddress;

        // Save the update contact back to local storage (csv format)
        localStorage.setItem(page, contact.serialize());

        // alert("Contact updated successfully!");
        // Redirect to contact list
        router.navigate("/contact-list");
    }

    /**
     * Handles the process of adding a new contact
     * @param event - the event object to prevent default form submission
     */
    function handleAddClick(event) {
        event.preventDefault();

        if (!validateForm()) {
            alert("Form contains errors. Please correct them before submitting");
            return;
        }

        const fullName = document.getElementById("fullName").value;
        const contactNumber = document.getElementById("contactNumber").value;
        const emailAddress = document.getElementById("emailAddress").value;

        // Create and save new contact
        AddContact(fullName, contactNumber, emailAddress);

        // Redirect to contact list
        router.navigate("/contact-list");
    }

    /**
     * Validate the entire form by checking the validity of each input field
     * @return {boolean} - return true if all fields pass validation, false otherwise
     */
    function validateForm() {
        return (
            validateInput("fullName") &&
            validateInput("contactNumber") &&
            validateInput("emailAddress")
        );
    }


    /**
     * Validates an input based on predefined validation rule
     * @param fieldId
     * @returns {boolean} -  returns true of valid, false otherwise
     */
    function validateInput(fieldId) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(`${fieldId}-error`);
        console.log(errorElement);
        const rule = VALIDATION_RULES[fieldId];

        if (!field || !errorElement || !rule) {
            console.warn(`[WARN] Validation rules not found for : ${fieldId}`);
            return false;
        }

        // Check if the input is empty
        if (field.value.trim() === "") {
            errorElement.textContent = "This field is required";
            errorElement.style.display = "block";
            return false;
        }

        // check field against regular expression
        if (!rule.regex.test(field.value)) {
            errorElement.textContent = rule.errorMessage;
            errorElement.style.display = "block";
            return false;
        }

        errorElement.textContent = "";
        errorElement.style.display = "none";
        return true;
    }

    /**
     * centralized validation rules for input fields
     * @type {{fullName: {regex: RegExp, errorMessage: string}, contactNumber: {regex: RegExp, errorMessage: string}, emailAddress: {regex: RegExp}, catch(*): void}}
     */
    const VALIDATION_RULES = {
        fullName: {
            regex: /^[A-Za-z\s]+$/, // Allows for only letters amd spaces
            errorMessage: "Full Name must contain only letter and spaces"
        },
        contactNumber: {
            regex: /^\d{3}-\d{3}-\d{4}$/,
            errorMessage: "Contact Number must be in format ###-###-####"
        },
        emailAddress: {
            regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            errorMessage: "Invalid email address: must be a valid email address format."
        }
    }


    /**
     * Creates new contacts
     * @param fullName the full name of the contact
     * @param contactNumber the phone number of the contact
     * @param emailAddress the email address of the contact
     *
     */
    function AddContact(fullName, contactNumber, emailAddress) {
        console.log("[DEBUG] AddContact() triggered...")

        if (!validateForm()) {
            alert("Form contains errors. Please correct them before submitting");
            return;
        }

        let contact = new core.Contact(fullName, contactNumber, emailAddress);
        if (contact.serialize()) {
            // The primary key for a contact --> contact_ + date & time
            let key = `contact_${Date.now()}`;
            localStorage.setItem(key, contact.serialize());
        } else {
            console.error("[ERROR] Contact serialization failed");
        }

        router.navigate("/contact-list");
    }


    /**
     * loads the edit page and updates the list when the values on the input are updated
     *
     */
    function DisplayEditPage() {
        console.log("Called DisplayEditPage() .....");

        const page = location.hash.split("#")[2];

        switch (page) {
            case "add": {
                // Add a new contact
                const heading = document.querySelector("main>h1");
                const editButton = document.getElementById("editButton");
                const cancelButton = document.getElementById("cancelButton");

                // Update Styling
                document.title = "Add Contact";

                if (heading) {
                    heading.textContent = "Add Contact";
                }

                if (editButton) {
                    editButton.innerHTML = `<i class="fa-solid fa-user-plus"></i> Add Contact`;
                    editButton.classList.remove("btn-primary");
                    editButton.classList.add("btn-primary");
                }
                addEventListenerOnce("editButton", "click", handleAddClick);
                addEventListenerOnce("cancelButton", "click", handleCancelClick);
                break;
            }
            default: {
                // Edit an existing contact
                const contact = new core.Contact();
                const contactData = localStorage.getItem(page);

                if (contactData) {
                    contact.deserialize(contactData);
                }

                //prepopulate the form with current values
                document.getElementById("fullName").value = contact.fullName;
                document.getElementById("contactNumber").value = contact.contactNumber;
                document.getElementById("emailAddress").value = contact.emailAddress;

                const editButton = document.getElementById("editButton");
                const cancelButton = document.getElementById("cancelButton");

                if (editButton) {
                    editButton.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Edit`;
                    editButton.classList.remove("btn-primary");
                    editButton.classList.add("btn-primary");
                }
                addEventListenerOnce("editButton", "click",
                    (event) => handleEditClick(event, contact, page));
                addEventListenerOnce("cancelButton", "click", handleCancelClick);
                break;
            }
        }


    }

    /**
     * Attaches validation event listeners to form input fields dynamically
     * @param elementId
     * @param event
     * @param handler
     */
    function addEventListenerOnce(elementId, event, handler) {

        // retrieve the element from the DOM
        const element = document.getElementById(elementId);

        if (element) {
            element.removeEventListener(event, handler);
            element.addEventListener(event, handler);
        } else {
            console.warn(`[WARN] Element with ID '${elementId}' not found`);
        }
    }

    function attachValidationListeners() {
        console.log("[INFO] Attaching validation listeners.......");

        Object.keys(VALIDATION_RULES).forEach((fieldId) => {
            const field = document.getElementById(fieldId);

            if (!field) {
                console.warn(`[WARN] field ${fieldId} not found. Skipping listener`);
                return;
            }

            //Attach event listener using the centralized validation method
            addEventListenerOnce(fieldId, "input", () => validateInput(fieldId));
        })
    }

    /**
     * Calls api that displays the current weather of the day
     */
    async function DisplayWeather() {

        const apiKey = "aed8a2ea573812f57f424e31770b7114";
        const city = "Oshawa";
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

        try {
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


        } catch (error) {
            console.error(`Error calling openweathermap for weather`);
            document.getElementById("weather-data").textContent = "Unable to fetch weather data at this time";
        }
    }


    /**
     * Loads the contact list page to edit or add or display contacts stored
     */
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
            router.navigate("/edit#add")
        });


        const deleteButton = document.querySelectorAll("button.delete");
        deleteButton.forEach((button) => {

            button.addEventListener("click", function () {

                const contactKey = this.value;
                console.log(`[DEBUG] Deleting contact with contact ID: ${contactKey}`);
                if (!contactKey.startsWith("contact_")) {
                    console.error(`[ERROR] Invalid contact key format: ${contactKey}`);
                    return;
                }

                if (confirm("Delete contact, please confirm")) {
                    localStorage.removeItem(this.value)
                    DisplayContactListPage();
                    router.navigate("/contact-list");
                    // location.href = "contact-list.html";
                }
            });
        });
        const editButton = document.querySelectorAll("button.edit");
        editButton.forEach((button) => {

            button.addEventListener("click", function () {
                router.navigate(`/edit#${this.value}`)
                // location.href = "edit.html#" + this.value;
            });
        });
    }

    /**
     * Loads the home page
     */
    function DisplayHomePage() {
        console.log("Calling DisplayHomePage...");

        const main = document.querySelector("main");
        main.innerHTML = "";

        main.insertAdjacentHTML(
            "beforeend",
            `<button id="AboutUsBtn" class="btn btn-primary">About Us</button>

                <div id="weather" class="mt-5">
                    <h3>Weather Information</h3>
                    <p id="weather-data">Fetching weather data...</p>
                </div>
                
                <p id="MainParagraph" class="mt-5"> This is my main paragraph</p>
                <article class="container">
                    <p id="ArticleParagraph" class="mt-3">This is my article paragraph</p>
                </article>`
        )

        let aboutUsButton = document.getElementById("AboutUsBtn");
        aboutUsButton.addEventListener("click", (event) => {
            router.navigate("/about");
        });

        DisplayWeather();
    }

    /**
     * Loads the products page
     */
    function DisplayProductsPage() {
        console.log("Calling DisplayProductsPage...");
    }

    /**
     * Loads the service page
     */
    function DisplaySerivcesPage() {
        console.log("Calling DisplaySerivcesPage...");
    }

    /**
     * Loads the About page
     */
    function DisplayAboutPage() {
        console.log("Calling DisplayAboutPage...");
    }

    /**
     * Loads the contact page to create new contact
     */
    function DisplayContactPage() {
        console.log("Calling DisplayContactPage...");

        let sendButton = document.getElementById("sendButton");
        let subscribeCheckbox = document.getElementById("subscribeCheckbox");

        sendButton.addEventListener("click", function (event) {
            event.preventDefault();
            if (subscribeCheckbox.checked) {
                AddContact(
                    document.getElementById("fullName").value,
                    document.getElementById("contactNumber").value,
                    document.getElementById("emailAddress").value,
                );
            }else {
                alert("Please click the check box")
            }
        })

        const contactListButton = document.getElementById("showContactList");
        contactListButton.addEventListener("click", function (event) {
            event.preventDefault();
            router.navigate("/contact-list");
        });
    }

    /**
     * Listen for changes and update the navigation links
     */
    document.addEventListener("routeLoaded", (event) => {
        const newPath = event.detail; //extract the route from the event passed
        console.log(`[INFO] Route Loaded: ${newPath}`);

        LoadHeader().then(() => {
            handlePageLogic(newPath);
        })
    })

    window.addEventListener("sessionExpired", () => {
        console.warn("[SESSION] Redirecting the user due to inactivity.");
        router.navigate("/login");
    });

    function handlePageLogic(path) {

        document.title = pageTitle[path] || "Untitled Page";

        const protectedRoutes = ["/contact-list", "/edit"];
        if (protectedRoutes.includes(path)) {
            AuthGuard(); //redirected to /login if not authenticated
        }

        switch (path) {
            case "/":
                DisplayHomePage();
                break;
            case "/about":
                DisplayAboutPage();
                break;
            case "/products":
                DisplayProductsPage();
                break;
            case "/services":
                DisplaySerivcesPage();
                break;
            case "/contact":
                DisplayContactPage();
                attachValidationListeners();
                break;
            case "/contact-list":
                DisplayContactListPage();
                break;
            case "/edit":
                DisplayEditPage();
                attachValidationListeners();
                break;
            case "/login":
                DisplayLoginPage();
                break;
            case "/register":
                DisplayRegisterPage();
                break;
            default:
                console.warn(`[WARNING] No display logic found for: ${path}`);

        }
    }

    async function Start() {
        console.log("Starting App...");

        // Load header first then run CheckLogin
        await LoadHeader();
        await LoadFooter();
        AuthGuard();

        const currentPath = location.hash.slice(1) || "/";
        router.loadRoute(currentPath);

        handlePageLogic(currentPath);
    }

    window.addEventListener("DOMContentLoaded", () => {
        console.log("DOM fully loaded and parsed");
        Start();
    });

})()
