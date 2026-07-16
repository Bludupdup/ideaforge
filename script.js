const API_URL = "https://ideaforge-7cpk.onrender.com/predict"; // change to your deployed backend URL
 
const form = document.getElementById('scanForm');
const result = document.getElementById('result');
const btn = form.querySelector('button[type="submit"]');
 
// Wire up toggle buttons (Yes/No pills) to their hidden inputs
document.querySelectorAll('.toggle-group').forEach(group => {
  const hiddenInput = document.getElementById(group.dataset.target);
  group.querySelectorAll('.toggle-btn').forEach(option => {
    option.addEventListener('click', () => {
      group.querySelectorAll('.toggle-btn').forEach(o => o.classList.remove('active'));
      option.classList.add('active');
      if (hiddenInput) hiddenInput.value = option.dataset.value;
    });
  });
});
 
function getToggleValue(id) {
  const val = document.getElementById(id).value;
  return val === "" ? null : Number(val);
}
 
// ---- Account age: auto-calculated from a "created on" date picker ----
const accCreatedDate = document.getElementById('accCreatedDate');
const accAgeHidden = document.getElementById('accAge');
const accAgeHint = document.getElementById('accAgeHint');
 
// Don't allow picking a future date
accCreatedDate.max = new Date().toISOString().split('T')[0];
 
function updateAccountAge() {
  if (!accCreatedDate.value) {
    accAgeHidden.value = "";
    accAgeHint.textContent = "Account age will be calculated automatically";
    return;
  }
  const created = new Date(accCreatedDate.value + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.max(0, Math.round((today - created) / (1000 * 60 * 60 * 24)));
  accAgeHidden.value = diffDays;
  accAgeHint.textContent = `Account age: ${diffDays} day${diffDays === 1 ? "" : "s"}`;
}
accCreatedDate.addEventListener('change', updateAccountAge);
accCreatedDate.addEventListener('input', updateAccountAge);
 
// ---- Username signals: auto-calculated from the username field ----
const usernameInput = document.getElementById('accId');
const usernameDigitRatio = document.getElementById('usernameDigitRatio');
const usernameLength = document.getElementById('usernameLength');
 
function updateUsernameSignals() {
  const val = usernameInput.value || "";
  const len = val.length;
  const digitCount = (val.match(/[0-9]/g) || []).length;
  const ratio = len > 0 ? digitCount / len : 0;
  usernameLength.value = len;
  usernameDigitRatio.value = ratio.toFixed(2);
}
usernameInput.addEventListener('input', updateUsernameSignals);
 
// ---- Sliders: Profile Completeness & Duplicate Post Content Ratio ----
function wireSlider(sliderId, labelId) {
  const slider = document.getElementById(sliderId);
  const label = document.getElementById(labelId);
  const update = () => { label.textContent = `${slider.value}%`; };
  slider.addEventListener('input', update);
  update();
}
wireSlider('profileCompleteness', 'profileCompletenessValue');
wireSlider('dupRatio', 'dupRatioValue');
 
form.addEventListener('submit', async (e) => {
  e.preventDefault();
 
  // Validate required toggles were actually clicked
  const requiredToggles = ['hasPfp', 'defaultAvatar', 'hasBio', 'verified'];
  for (const id of requiredToggles) {
    if (getToggleValue(id) === null) {
      alert("Please answer all Yes/No questions before submitting.");
      return;
    }
  }
 
  if (!accCreatedDate.value) {
    alert("Please select the account creation date.");
    return;
  }
  updateAccountAge();
 
  btn.disabled = true;
  btn.textContent = "Investigating...";
 
  const payload = {
    platform: document.getElementById('platform').value,
    account_age_days: Number(accAgeHidden.value) || 0,
    has_profile_picture: getToggleValue('hasPfp'),
    is_default_avatar: getToggleValue('defaultAvatar'),
    bio_length: Number(document.getElementById('bioLength').value) || 0,
    has_bio: getToggleValue('hasBio'),
    username_digit_ratio: Number(usernameDigitRatio.value) || 0,
    username_length: Number(usernameLength.value) || 0,
    follower_count: Number(document.getElementById('followers').value) || 0,
    following_count: Number(document.getElementById('following').value) || 0,
    is_verified: getToggleValue('verified'),
    profile_completeness: Number(document.getElementById('profileCompleteness').value) / 100,
    posts_per_day_avg: Number(document.getElementById('postRate').value) || 0,
    pct_posts_duplicate_content: Number(document.getElementById('dupRatio').value) / 100,
    avg_time_between_posts_min: Number(document.getElementById('avgTimeBetweenPosts').value) || 0,
    device_fingerprint_diversity: Number(document.getElementById('deviceDiversity').value) || 0,
  };
 
  let data, demo = false;
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Server responded ${res.status}`);
    data = await res.json();
  } catch (err) {
    console.error("Prediction request failed:", err);
    // Fallback so the demo still works if the backend isn't reachable
    const suspicious =
      payload.posts_per_day_avg > 40 ||
      payload.follower_count < 15 ||
      payload.has_profile_picture === 0;
    data = { prediction: suspicious ? 1 : 0, probabilities: suspicious ? [0.22, 0.78] : [0.85, 0.15] };
    demo = true;
  }
 
  showResult(data, demo);
  btn.disabled = false;
  btn.textContent = "Run Investigation 🕵️";
});
 
function showResult(data, demo) {
  // ASSUMPTION: prediction 1 = fake, 0 = real. Flip this if your model was trained the other way.
  const isFake = data.prediction === 1;
  const confidence = data.probabilities ? data.probabilities[data.prediction] : 0.5;
  const pct = Math.round(confidence * 100);
 
  result.className = "result show " + (isFake ? "fake" : "real");
  result.innerHTML = `
    <h2>${isFake ? "🚨 Case Closed: FAKE" : "✅ Verdict: Genuine"}</h2>
    <p>Confidence: ${pct}%</p>
    ${demo ? '<p style="opacity:0.7">(demo mode — backend unreachable, showing heuristic guess)</p>' : ''}
  `;
}
 