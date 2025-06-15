<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/functions.php';


$typeId = isset($_GET['type']) ? (int) $_GET['type'] : null;

// Pagination
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$parPage = 12;
$debut = ($page - 1) * $parPage;


// Filtres
$filtres = [];
$requeteFiltres = "";

if (!empty($_GET['type'])) {
    $filtres[] = "t.id = " . (int)$_GET['type'];
}

if (!empty($_GET['disponibilite'])) {
    if ($_GET['disponibilite'] === 'disponible') {
        $filtres[] = "m.id NOT IN (SELECT media_id FROM emprunt WHERE Statut_Emprunt IN ('emprunté', 'en retard'))";
    } elseif ($_GET['disponibilite'] === 'indisponible') {
        $filtres[] = "m.id IN (SELECT media_id FROM emprunt WHERE Statut_Emprunt IN ('emprunté', 'en retard'))";
    }
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
$medias = $connexion->query($query)->fetchAll();

// Total des médias
$total = $connexion->query("
    SELECT COUNT(*) 
    FROM media m
    JOIN type t ON m.type_id = t.id
    $requeteFiltres
")->fetchColumn();



$totalPages = ceil($total / $parPage);

// Types de médias pour filtres
$types = $connexion->query("SELECT * FROM type")->fetchAll();
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Catalogue - Médiathèque Livresse</title>
    <link rel="stylesheet" href="../assets/css/user.css">
</head>
<body>
    <?php include('header-user.php'); ?>
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
            <option value="disponible" <?= (isset($_GET['disponibilite']) && $_GET['disponibilite'] === 'disponible') ? 'selected' : '' ?>>Disponible</option>
            <option value="indisponible" <?= (isset($_GET['disponibilite']) && $_GET['disponibilite'] === 'indisponible') ? 'selected' : '' ?>>Indisponible</option>
        </select>
            <a href="catalogue.php" class="btn btn-secondary">Réinitialiser</a>

        </form>
        </div>

        <div class="catalogue-grid">
            <?php foreach ($medias as $media): ?>
                <div class="catalogue-card <?= $media['est_emprunte'] > 0 ? 'indisponible' : 'disponible' ?>">
                    <a href="details.php?id=<?= $media['id'] ?>" class="btn btn-secondary">
                    <img src="../assets/img/<?= slugify($media['Titre']) ?>.jpg" alt="<?= htmlspecialchars($media['Titre']) ?>">
                    <div class="catalogue-info">
                        <h3><?= $media['Titre'] ?></h3>
                        <p><?= $media['Auteur'] ?></p>
                        <p>Type : <?= $media['Type'] ?></p>
                        <span class="disponibilite">
                            <?= $media['est_emprunte'] > 0 ? 'Indisponible' : 'Disponible' ?>
                        </span>
                        </a>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>

        <?php
            $queryString = $_GET;
            unset($queryString['page']);
            ?>
            <div class="pagination">
                <?php for ($i = 1; $i <= $totalPages; $i++): ?>
                    <?php $queryString['page'] = $i; ?>
                    <a href="?<?= http_build_query($queryString) ?>" class="<?= $page == $i ? 'active' : '' ?>">
                        <?= $i ?>
                    </a>
                <?php endfor; ?>
            </div>

    </main>

    <?php include('footer-user.php');?>
    <script src="../assets/js/user.js"></script>
</body>
</html>