document.addEventListener('DOMContentLoaded', () => {
    // Fonction de recherche en temps réel
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    if (searchInput && searchResults) {
        searchInput.addEventListener('input', async (e) => {
            const query = e.target.value;
            
            if (query.length < 3) {
                searchResults.innerHTML = '';
                return;
            }

            try {
                const response = await fetch(`recherche.php?q=${encodeURIComponent(query)}`);
                const results = await response.json();

                searchResults.innerHTML = results.map(media => `
                    <div class="search-result-item">
                        <img src="../assets/img/placeholder.jpg" alt="${media.Titre}">
                        <div>
                            <h3>${media.Titre}</h3>
                            <p>${media.Auteur}</p>
                            <a href="details.php?id=${media.id}">Voir détails</a>
                        </div>
                    </div>
                `).join('');
            } catch (error) {
                console.error('Erreur de recherche', error);
            }
        });
    }

    // Filtres dynamiques
    const filterForm = document.querySelector('.catalogue-filters form');
    if (filterForm) {
        filterForm.addEventListener('change', () => {
            filterForm.submit();
        });
    }
});