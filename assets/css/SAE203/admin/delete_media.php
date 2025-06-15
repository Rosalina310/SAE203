<?php
// delete_media.php

// 1. Incluez votre fichier de configuration de base de données
//    Assurez-vous que le chemin est correct en fonction de l'emplacement de ce fichier.
//    Par exemple, si stock.php et delete_media.php sont dans 'admin/', et config.php est dans 'includes/',
//    alors le chemin devrait être '../includes/config.php'.
require_once '../includes/config.php'; // Ajustez ce chemin si nécessaire
require_once '../includes/functions.php'; // Incluez vos fonctions si vous en avez besoin (ex: pour cleanInput, etc.)

// Définir l'en-tête pour indiquer que la réponse est au format JSON
header('Content-Type: application/json');

// Initialiser la réponse par défaut en cas d'échec
$response = ['success' => false, 'message' => ''];

// 2. Vérifier si la requête est de type POST et si l'ID est présent
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['id'])) {
    // 3. Récupérer et valider l'ID
    $mediaId = filter_var($_POST['id'], FILTER_VALIDATE_INT);

    if ($mediaId === false || $mediaId <= 0) {
        $response['message'] = 'ID de média invalide.';
        echo json_encode($response);
        exit;
    }

    try {
        // Utilisation de la connexion PDO définie dans config.php
        global $pdo; // Assurez-vous que votre $pdo est accessible globalement ou passé en paramètre

        // Démarrer une transaction pour assurer l'intégrité des données
        $pdo->beginTransaction();

        // IMPORTANT : Supprimer d'abord les enregistrements dépendants (exemplaires)
        // si votre table `exemplaire` a une clé étrangère qui référence `media.id`
        // et que la suppression en cascade n'est pas configurée au niveau de la BDD.
        // Si vous avez une contrainte ON DELETE CASCADE sur votre table `exemplaire`,
        // vous pouvez omettre cette première suppression d'exemplaires.

        $stmt_exemplaires = $pdo->prepare("DELETE FROM exemplaire WHERE media_id = :media_id");
        $stmt_exemplaires->bindParam(':media_id', $mediaId, PDO::PARAM_INT);
        $stmt_exemplaires->execute();

        // 4. Exécuter la requête DELETE pour le média
        $stmt_media = $pdo->prepare("DELETE FROM media WHERE id = :id");
        $stmt_media->bindParam(':id', $mediaId, PDO::PARAM_INT);

        if ($stmt_media->execute()) {
            // Vérifier si une ligne a été affectée (si le média existait)
            if ($stmt_media->rowCount() > 0) {
                $pdo->commit(); // Confirmer la transaction
                $response['success'] = true;
                $response['message'] = 'Média supprimé avec succès.';
            } else {
                $pdo->rollBack(); // Annuler la transaction
                $response['message'] = 'Média non trouvé ou déjà supprimé.';
            }
        } else {
            $pdo->rollBack(); // Annuler la transaction
            $response['message'] = 'Erreur lors de l\'exécution de la suppression du média.';
            // Log l'erreur pour le débogage (ne pas afficher à l'utilisateur)
            error_log("Erreur de suppression du média: " . implode(" ", $stmt_media->errorInfo()));
        }

    } catch (PDOException $e) {
        $pdo->rollBack(); // Annuler la transaction en cas d'exception
        $response['message'] = 'Erreur de base de données : ' . $e->getMessage();
        error_log("Erreur PDO lors de la suppression du média: " . $e->getMessage());
    }

} else {
    $response['message'] = 'Requête invalide ou ID manquant.';
}

// 5. Retourner la réponse JSON
echo json_encode($response);
exit;
?>