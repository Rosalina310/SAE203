<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/SAE203/includes/config.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/SAE203/includes/functions.php';


$typeId = isset($_GET['type']) ? (int) $_GET['type'] : null;

// Pagination
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$parPage = 12;
$debut = ($page - 1) * $parPage;


// Filtres
$filtres = [];
$requeteFiltres = "";

if (isset($_GET['type'])) {
    $filtres[] = "t.id = " . (int)$_GET['type'];
}

if (isset($_GET['disponibilite'])) {
    $filtres[] = $_GET['disponibilite'] === 'disponible' 
        ? "m.id NOT IN (SELECT media_id FROM emprunt WHERE Statut_Emprunt IN ('emprunté', 'en retard'))" 
        : "m.id IN (SELECT media_id FROM emprunt WHERE Statut_Emprunt IN ('emprunté', 'en retard'))";
}

if (!empty($filtres)) {
    $requeteFiltres = "WHERE " . implode(" AND ", $filtres);
}

// Récupération des médias
$query = "
    SELECT m.*, t.Nom as Type,
    (SELECT COUNT(*) FROM emprunt e WHERE e.media_id = m.id AND e.Statut_Emprunt IN ('emprunté', 'en retard')) as est_emprunte
    FROM media m
    JOIN type t ON m.type_id = t.id
    $requeteFiltres
    LIMIT $debut, $parPage
";
$medias = $db->query($query)->fetchAll();

// Total des médias
$total = $db->query("
    SELECT COUNT(*) 
    FROM media m
    JOIN type t ON m.type_id = t.id
    $requeteFiltres
")->fetchColumn();

$totalPages = ceil($total / $parPage);

// Types de médias pour filtres
$types = $db->query("SELECT * FROM type")->fetchAll();
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Catalogue - Médiathèque Livresse</title>
    <link rel="stylesheet" href="/SAE203/assets/css/user.css">
</head>
<body>
    <?php include $_SERVER['DOCUMENT_ROOT'] . '/SAE203/user/header-user.php'; ?>
    <main class="catalogue-container">
        <div class="catalogue-filters">
            <form method="get">
            <select name="type">
                <option value="">Tous les types</option>
                <?php foreach ($types as $type): ?>
                    <option value="<?= $type['id'] ?>" <?= (isset($_GET['type']) && $_GET['type'] == $type['id']) ? 'selected' : '' ?>>
                        <?= htmlspecialchars($type['Nom']) ?>
                    </option>
                <?php endforeach; ?>
            </select>

            <select name="disponibilite">
                <option value="">Tous les statuts</option>
                <option value="disponible" <?= (isset($_GET['disponibilite']) && $_GET['disponibilite'] == 'disponible') ? 'selected' : '' ?>>
                    Disponible
                </option>
                <option value="indisponible" <?= (isset($_GET['disponibilite']) && $_GET['disponibilite'] == 'indisponible') ? 'selected' : '' ?>>
                    Indisponible
                </option>
            </select>

            <button type="submit">Filtrer</button>
        </form>
        </div>

        <div class="catalogue-grid">
            <?php foreach ($medias as $media): ?>
                <div class="catalogue-card <?= $media['est_emprunte'] > 0 ? 'indisponible' : 'disponible' ?>">
                    <img src="/SAE203/assets/img/<?= str_replace(' ', '-', strtolower($media['Titre'])) ?>.jpg" alt="<?= htmlspecialchars($media['Titre']) ?>">
                    <div class="catalogue-info">
                        <h3><?= $media['Titre'] ?></h3>
                        <p><?= $media['Auteur'] ?></p>
                        <p>Type : <?= $media['Type'] ?></p>
                        <span class="disponibilite">
                            <?= $media['est_emprunte'] > 0 ? 'Indisponible' : 'Disponible' ?>
                        </span>
                        <a href="details.php?id=<?= $media['id'] ?>" class="btn btn-secondary">Détails</a>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>

        <div class="pagination">
            <?php for ($i = 1; $i <= $totalPages; $i++): ?>
                <a href="?page=<?= $i ?>" class="<?= $page == $i ? 'active' : '' ?>"><?= $i ?></a>
            <?php endfor; ?>
        </div>
    </main>

    <?php include $_SERVER['DOCUMENT_ROOT'] . '/SAE203/user/footer-user.php'; ?>
    <script src="SAE203/assets/js/user.js"></script>
</body>
</html>