const newsContainer = document.getElementById("news-container");
const searchBtn = document.getElementById("searchBtn");
const search = document.getElementById("search");

function fetchNews() {
  try {
    fetch("./news.json")
      .then((res) => res.json())
      .then((data) => {
        displayNews(data.articles);
      });
  } catch (error) {}
}

function displayNews(data) {
  newsContainer.innerHTML = "";

  data.forEach((item) => {
    const newsCard = document.createElement("div");
    newsCard.classList.add("news-card");

    newsCard.innerHTML = `
        <h2>${item.title}</h2>
        <p>${item.description || "No description available."}</p>
        <a href="${item.url}" target="_blank">Read more</a>
    `;

    newsContainer.appendChild(newsCard);
  });
}

searchBtn.addEventListener("click", () => {
  const term = search.value.trim().toLowerCase();
  fetch("news.json")
    .then((response) => response.json())
    .then((data) => {
      const filteredNews = data.articles.filter(
        (article) =>
          article.title.toLowerCase().includes(term) ||
          article.description.toLowerCase().includes(term)
      );
      displayNews(filteredNews);
    });
});

fetchNews();
