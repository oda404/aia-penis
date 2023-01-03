
const backend_url = "http://localhost:8889";

function GetURLParameter(sParam) {
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) {
            return sParameterName[1];
        }
    }

    return undefined;
}

async function main() {

    const appId = GetURLParameter("id")

    if (appId === undefined)
        window.location.href = "/";

    const resp = await fetch(`${backend_url}/review-has`, {
        method: "post",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ "id": appId }),
    });

    if (resp.status === 200)
        location.href = "/review-succ.html"

    document.getElementById("review-form").addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!document.querySelector('input[name="rate"]:checked')) {
            if (document.getElementsByClassName("selectRating").length > 0)
                return;

            const el = document.createElement("div");
            el.innerHTML = `<div class="selectRating">Selectati un rating.</div>`
            document.getElementById("review").appendChild(el);
        }
        else {
            const rate = document.querySelector('input[name="rate"]:checked').value;
            const desc = document.getElementById("review-desc").value;

            const payload = JSON.stringify({ "id": appId, "stars": rate, "desc": desc });

            const resp = await fetch(`${backend_url}/review-add`, {
                method: "post",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: payload,
            });

            window.location.href = "/review-succ.html"

            console.log(rate)
            console.log(desc)
        }
    })
}

main();
