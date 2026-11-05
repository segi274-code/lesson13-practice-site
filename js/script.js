var setupBox = document.getElementById("setup");
var form = document.getElementById("form");
var sendBtn = document.getElementById("sendBtn");
var resultBox = document.getElementById("result");
var replyText = document.getElementById("reply");
var hintText = document.getElementById("hint");

function setSetup(state, note) {
  setupBox.className = "status " + state;
  setupBox.querySelector(".mark").textContent = state === "good" ? "✓" : state === "bad" ? "✗" : "…";
  setupBox.querySelector(".note").textContent = note;
}

function showResult(state, reply, hint) {
  resultBox.hidden = false;
  resultBox.className = "result " + state;
  replyText.textContent = reply;
  hintText.textContent = hint;
}

// Check whether the webhook address has been added in Netlify
fetch("/api/send")
  .then(function (res) { return res.json(); })
  .then(function (data) {
    if (data.configured) setSetup("good", "Set. Netlify knows where to send.");
    else setSetup("bad", "Not set yet. Add MAKE_WEBHOOK_URL in Netlify’s Environment variables, then redeploy.");
  })
  .catch(function () {
    setSetup("bad", "Function not found. This site must be deployed from GitHub, not by drag and drop.");
  });

form.addEventListener("submit", function (e) {
  e.preventDefault();
  sendBtn.disabled = true;
  sendBtn.textContent = "Sending…";
  var payload = {
    title: document.getElementById("title").value.trim(),
    issue: document.getElementById("issue").value.trim()
  };
  fetch("/api/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data.error === "not_set") {
        showResult("bad", "Not sent", "Add MAKE_WEBHOOK_URL in Netlify first.");
      } else if (data.error) {
        showResult("bad", "Couldn’t reach Make", data.error);
      } else if (data.reply === "Accepted") {
        showResult("good", "Accepted", "Make received it, but there’s no Webhook response module yet, so it just says Accepted. Add one to send something useful back.");
      } else if (data.status >= 200 && data.status < 300) {
        showResult("good", data.reply, "That came back from your Make scenario. The round trip works.");
      } else {
        showResult("bad", "Make replied with an error (" + data.status + ")", data.reply || "Check the scenario is switched on, or click Run once in Make before sending.");
      }
    })
    .catch(function () {
      showResult("bad", "Something went wrong", "The page couldn’t reach its Netlify function.");
    })
    .finally(function () {
      sendBtn.disabled = false;
      sendBtn.textContent = "Send to Make";
    });
});
