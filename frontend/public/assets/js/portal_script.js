
const backend_url = "http://localhost:8889";

async function closeAppointmentButton(id) {
    let resp = await fetch(`${backend_url}/appointment-done`, {
        method: "post",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        credentials: "include",
        body: JSON.stringify({ "id": id })
    });

    window.location.reload();
}

async function main() {

    let resp = await fetch(`${backend_url}/admin`, {
        method: "get",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        credentials: "include"
    });

    if (resp.status === 400) {
        document.getElementById("root").innerHTML = ` 
        <form id="admin-form-id" class="form">
            <div class="top"><img src="assets/images/img.png"></div>
            <div class="container1">
                <div class="input-container ic2">
                    <i class="fa-regular fa-user"></i>
                    <input id="User" class="input" type="text" placeholder="User" required />
                </div>
                <div class="input-container ic2">
                    <i class="fa-solid fa-key"></i>
                    <input id="parola" class="input" type="password" placeholder="Parola" required />
                </div>
            </div>
            <div class="bottom"><button id="button" type="submit" class="submit">Trimite</button>
            </div>
        </form>`

        document.getElementById("admin-form-id").addEventListener("submit", async (e) => {
            e.preventDefault();

            const username = document.getElementById("User").value;
            const pass = document.getElementById("parola").value;

            const payload = JSON.stringify({
                "username": username,
                "password": pass
            });

            const resp = await fetch(`${backend_url}/admin-session`, {
                method: "post",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: payload,
                credentials: "include"
            });

            if (resp.status === 200) {
                window.location.reload();
            }
            else {
                const el = document.createElement("div");
                el.innerHTML = `<div class="input-container ic2">User sau prola gresita!</div>`

                document.getElementById("root").getElementsByClassName("container1")[0].appendChild(el);
            }
        })

    }
    else {
        const resp = await fetch(`${backend_url}/appointments`, {
            method: "get",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: "include"
        });

        if (resp.status !== 200) {
            window.location.reload();
            return;
        }

        let payload = await resp.json();

        console.log(payload);

        document.getElementById("root").innerHTML = ` 
            <form id="admin-form-id" class="form">
                <div class="top"><img src="assets/images/img.png"></div>
                <div id="admin-content" class="container1">
                </div>
            </form>
        `

        payload.sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
        })

        payload.forEach(app => {
            const date = new Date(app.date);
            let x = document.createElement("div");

            x.innerHTML = `
                <div class="idkanymore">
                    <div class="appointmentRoot">
                        <div class="appointmentHeader">
                            <div id="appHeader" class="straight">
                                <div>
                                    <b>Data programarii:</b>
                                    ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}
                                </div>
                            </div>
                            
                            <div class="divider" />
                        </div>
                        <div class="appointmentElement">
                            <b>Nume:</b>
                            ${app.lastname}
                        </div>
                        <div class="appointmentElement">
                            <b>Prenume:</b>
                            ${app.firstname}
                        </div>
                        <div class="appointmentElement">
                            <b>Email:</b>
                            ${app.email}
                        </div>
                        <div class="appointmentElement">
                            <b>Numar telefon:</b>
                            ${app.phone}
                        </div>
                    </div>
                </div>
            `

            if (!app.fulfilled) {
                let el = document.createElement("div");
                el.innerHTML = `
                    <div class="appStatusRoot">
                        <div class="appStatus">
                            Programare in asteptare
                        </div>
                        <button type="button" onclick="closeAppointmentButton('${app.id}')" class="appStatusButton">
                            <i class="fa-solid fa-check appStatusButtonSize"></i>
                        </button>
                    </div>`

                x.getElementsByClassName("straight")[0].appendChild(el);
            }
            else {
                let el = document.createElement("div");
                el.innerHTML = `
                    <div class="appStatusRoot">
                        <div class="appStatusOK">
                            Complet
                        </div>
                    </div>`

                if (app.review) {
                    const r = document.createElement("div");
                    r.innerHTML = `<div>${app.review.stars} stele</div>`
                    el.getElementsByClassName("appStatusRoot")[0].appendChild(r);
                    console.log(app.review);
                }
                else {
                    const r = document.createElement("div");
                    r.innerHTML = `<div class="reviewText">Fara review</div>`

                    el.getElementsByClassName("appStatusRoot")[0].appendChild(r);
                }

                x.getElementsByClassName("straight")[0].appendChild(el);
            }

            document.getElementById("admin-content").appendChild(x);
        })
    }
}

main();
