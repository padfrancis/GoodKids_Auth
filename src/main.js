// src/main.js
import { auth } from "./firebase.js";
import {
  applyActionCode,
  confirmPasswordReset,
} from "firebase/auth";

const contentBox = document.getElementById("contentBox");

function showMessage(html) {
  contentBox.innerHTML = html;
}

const params = new URLSearchParams(window.location.search);
const mode = params.get("mode");
const oobCode = params.get("oobCode");

if (!mode || !oobCode) {
  showMessage("<h2>Uh oh… invalid or missing link.</h2><p class='note'>Please open the latest link from your email.</p>");
} else if (mode === "verifyEmail") {
  showMessage("<div class='spinner'></div><p class='note'>Verifying your email…</p>");
  applyActionCode(auth, oobCode)
    .then(() => {
      showMessage(`
        <div class="yay">🎉</div>
        <h2>Email verified!</h2>
        <p class="note">You're all set. We'll take you back to the app.</p>
      `);
      setTimeout(() => (window.location.href = "goodkids://verified"), 2200);
    })
    .catch((err) => {
      console.error(err);
      showMessage("<h2>Verification failed.</h2><p class='error'>Try again or request a new link.</p>");
    });
} else if (mode === "resetPassword") {
  showMessage(`
    <h2>Reset Your Password</h2>
    <p class="note">Use a strong password you can remember.</p>
    <input type="password" id="newPassword" placeholder="New password" />
    <div class="meter"><div id="meterFill" class="meter-fill"></div></div>
    <ul id="rules" class="rules">
      <li data-rule="len">At least 8 characters</li>
      <li data-rule="upper">At least one uppercase letter</li>
      <li data-rule="num">At least one number</li>
    </ul>
    <button class="btn btn-primary" id="submitBtn" disabled>Submit</button>
    <div class="error" id="errorBox"></div>
  `);

  const pwdEl = document.getElementById("newPassword");
  const btnEl = document.getElementById("submitBtn");
  const meterEl = document.getElementById("meterFill");
  const errorBox = document.getElementById("errorBox");

  function validate(p) {
    const len = p.length >= 8;
    const upper = /[A-Z]/.test(p);
    const num = /[0-9]/.test(p);
    return { len, upper, num, all: len && upper && num };
  }

  pwdEl.addEventListener("input", () => {
    const v = validate(pwdEl.value);
    document.querySelectorAll(".rules li").forEach((li) => {
      li.classList.toggle("ok", v[li.dataset.rule]);
    });
    meterEl.style.width = `${(Object.values(v).filter(Boolean).length / 3) * 100}%`;
    btnEl.disabled = !v.all;
  });

  btnEl.addEventListener("click", () => {
    const v = validate(pwdEl.value);
    if (!v.all) {
      errorBox.textContent = "Please satisfy all password rules.";
      return;
    }
    confirmPasswordReset(auth, oobCode, pwdEl.value)
      .then(() => {
        showMessage(`
          <div class="yay">✅</div>
          <h2>Password reset!</h2>
          <p class="note">Taking you back to the app…</p>
          <div class="spinner" aria-hidden="true"></div>
        `);
        setTimeout(() => (window.location.href = "goodkids://resetdone"), 1800);
      })
      .catch((err) => {
        console.error(err);
        errorBox.textContent = err.message || "Reset failed. Try again.";
      });
  });
} else {
  showMessage(`<h2>Unsupported action</h2><p class="note">Mode: ${mode}</p>`);
}
