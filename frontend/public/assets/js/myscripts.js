function initMap() {
  const uluru = { lat: 45.65634431752302, lng: 25.59872733562484 };
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 10,
    center: uluru,
  });
  const marker = new google.maps.Marker({
    position: uluru,
    map: map,
  });
}

let slideIndex = 1;
window.initMap = initMap;
function plusSlides(n) {
  showSlides(slideIndex += n);
}

function showSlides(n) {
  let i;
  let slides = document.getElementsByClassName("mySlides");
  let dots = document.getElementsByClassName("dot");
  if (n > slides.length) { slideIndex = 1 }
  if (n < 1) { slideIndex = slides.length }
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  for (i = 0; i < dots.length; i++) {
    if (dots[i])
      dots[i].className = dots[i].className.replace(" active", "");
  }
  slides[slideIndex - 1].style.display = "block";
  if (dots[slideIndex - 1])
    dots[slideIndex - 1].className += " active";
}

function main() {

  const backend_url = "http://localhost:8889";

  showSlides(slideIndex);

  let appointmentForm = document.getElementById("appointment-form");
  appointmentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    let lname = document.getElementById("lastname").value;
    let email = document.getElementById("email").value;
    let start = document.getElementById("start").value;
    let fname = document.getElementById("firstname").value;
    let phone = document.getElementById("phone").value;

    let payload = JSON.stringify({
      "lastname": lname,
      "firstname": fname,
      "email": email,
      "phone": phone,
      "date": start
    })

    let resp = await fetch(`${backend_url}/appointment`, {
      method: "POST",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: payload
    });

    if (resp.status >= 200 && resp.status < 300) {
      window.location.assign("/success.html");
    }
  })
}

main();
