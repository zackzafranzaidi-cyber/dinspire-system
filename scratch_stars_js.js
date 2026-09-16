const fs = require('fs');
let js = fs.readFileSync('public/js/owner.js', 'utf8');

const regex = /const avgRating = filteredReviews\.length \? \(tStars \/ filteredReviews\.length\) : 0\.0;\s*animateNumber\("val-rating", avgRating, "", "", 1\);/;

const newRatingLogic = `const avgRating = filteredReviews.length ? (tStars / filteredReviews.length) : 0.0;
    animateNumber("val-rating", avgRating, "", "", 1);

    const starsContainer = document.getElementById("val-rating-stars");
    if (starsContainer) {
        let starsHtml = "";
        let roundedRating = Math.round(avgRating * 2) / 2;
        for (let i = 1; i <= 5; i++) {
            if (roundedRating >= i) {
                starsHtml += '<i class="fas fa-star drop-shadow-sm"></i>';
            } else if (roundedRating >= i - 0.5) {
                starsHtml += '<i class="fas fa-star-half-alt drop-shadow-sm"></i>';
            } else {
                starsHtml += '<i class="far fa-star text-gray-200"></i>';
            }
        }
        starsContainer.innerHTML = starsHtml;
    }`;

if (regex.test(js)) {
    js = js.replace(regex, newRatingLogic);
    fs.writeFileSync('public/js/owner.js', js);
    console.log("Updated rating logic in owner.js via regex.");
} else {
    console.log("Regex not found for rating logic.");
}
