<?php
/**
 * Fonctions CRUD et requêtes SQL - Médiathèque Livresse
 * Toutes les interactions avec la base de données
 */

// =============================================
// FONCTIONS POUR LES STATISTIQUES (TABLEAU DE BORD)
// =============================================

/**
 * Récupère les statistiques générales pour le tableau de bord
 */
function getStatistiquesGenerales() {
    global $connexion;
    
    try {
        // Total des objets (exemplaires)
        $stmt = $connexion->query("SELECT COUNT(*) as total_objets FROM exemplaire");
        $totalObjets = $stmt->fetch()['total_objets'];
        
        // Emprunts en cours
        $stmt = $connexion->query("SELECT COUNT(*) as emprunts_cours FROM emprunt WHERE Statut_Emprunt = 'emprunté'");
        $empruntsCours = $stmt->fetch()['emprunts_cours'];
        
        // Emprunts en retard
        $stmt = $connexion->query("SELECT COUNT(*) as emprunts_retard FROM emprunt WHERE Statut_Emprunt = 'en retard'");
        $empruntsRetard = $stmt->fetch()['emprunts_retard'];
        
        return [
            'total_objets' => $totalObjets,
            'emprunts_cours' => $empruntsCours,
            'emprunts_retard' => $empruntsRetard
        ];
    } catch (PDOException $e) {
        error_log("Erreur statistiques générales : " . $e->getMessage());
        return false;
    }
}

/**
 * Récupère les emprunts récents pour le tableau de bord
 */
function getEmpruntsRecents($limit = 5) {
    global $connexion;
    
    try {
        $sql = "SELECT e.ID_Emprunt, m.Titre, 
                       CONCAT(a.Prenom, ' ', a.Nom) as emprunteur,
                       e.Date_Emprunt, e.Date_Retour_Prévue, e.Statut_Emprunt
                FROM emprunt e
                JOIN media m ON e.media_id = m.id
                JOIN adherent a ON e.adherent_id = a.id
                WHERE e.Statut_Emprunt IN ('emprunté', 'en retard')
                ORDER BY e.Date_Emprunt DESC
                LIMIT :limit";
                
        $stmt = $connexion->prepare($sql);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    } catch (PDOException $e) {
        error_log("Erreur emprunts récents : " . $e->getMessage());
        return [];
    }
}

/**
 * Récupère les statistiques pour le graphique par type de média
 */
function getStatistiquesParType() {
    global $connexion;
    
    try {
        $sql = "SELECT t.Nom as type_nom, COUNT(e.id) as total_exemplaires
                FROM type t
                LEFT JOIN media m ON t.id = m.type_id
                LEFT JOIN exemplaire e ON m.id = e.media_id
                GROUP BY t.id, t.Nom
                ORDER BY total_exemplaires DESC";
                
        $stmt = $connexion->query($sql);
        return $stmt->fetchAll();
    } catch (PDOException $e) {
        error_log("Erreur statistiques par type : " . $e->getMessage());
        return [];
    }
}

// =============================================
// FONCTIONS POUR LES ADHÉRENTS
// =============================================

/**
 * Récupère tous les adhérents avec filtres optionnels
 */
function getAdherents($statut = null, $search = null, $limit = null, $offset = 0) {
    global $connexion;
    
    try {
        $sql = "SELECT a.*, 
                       COUNT(e.ID_Emprunt) as nb_emprunts_actifs
                FROM adherent a
                LEFT JOIN emprunt e ON a.id = e.adherent_id AND e.Statut_Emprunt IN ('emprunté', 'en retard')
                WHERE 1=1";
        
        $params = [];
        
        if ($statut) {
            $sql .= " AND a.Statut = :statut";
            $params['statut'] = $statut;
        }
        
        if ($search) {
            $sql .= " AND (a.Nom LIKE :search OR a.Prenom LIKE :search OR a.Email LIKE :search)";
            $params['search'] = "%$search%";
        }
        
        $sql .= " GROUP BY a.id ORDER BY a.Nom, a.Prenom";
        
        if ($limit) {
            $sql .= " LIMIT :limit OFFSET :offset";
            $params['limit'] = $limit;
            $params['offset'] = $offset;
        }
        
        $stmt = $connexion->prepare($sql);
        
        foreach ($params as $key => $value) {
            if ($key === 'limit' || $key === 'offset') {
                $stmt->bindValue(":$key", $value, PDO::PARAM_INT);
            } else {
                $stmt->bindValue(":$key", $value);
            }
        }
        
        $stmt->execute();
        return $stmt->fetchAll();
    } catch (PDOException $e) {
        error_log("Erreur récupération adhérents : " . $e->getMessage());
        return [];
    }
}

/**
 * Récupère un adhérent par son ID
 */
function getAdherentById($id) {
    global $connexion;
    
    try {
        $stmt = $connexion->prepare("SELECT * FROM adherent WHERE id = :id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetch();
    } catch (PDOException $e) {
        error_log("Erreur récupération adhérent : " . $e->getMessage());
        return false;
    }
}

/**
 * Ajoute un nouvel adhérent
 */
function ajouterAdherent($nom, $prenom, $email) {
    global $connexion;
    
    try {
        $sql = "INSERT INTO adherent (Nom, Prenom, Email, Statut) VALUES (:nom, :prenom, :email, 'actif')";
        $stmt = $connexion->prepare($sql);
        
        $stmt->bindParam(':nom', $nom);
        $stmt->bindParam(':prenom', $prenom);
        $stmt->bindParam(':email', $email);
        
        return $stmt->execute();
    } catch (PDOException $e) {
        error_log("Erreur ajout adhérent : " . $e->getMessage());
        return false;
    }
}

/**
 * Modifie un adhérent existant
 */
function modifierAdherent($id, $nom, $prenom, $email, $statut) {
    global $connexion;
    
    try {
        $sql = "UPDATE adherent SET Nom = :nom, Prenom = :prenom, Email = :email, Statut = :statut WHERE id = :id";
        $stmt = $connexion->prepare($sql);
        
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->bindParam(':nom', $nom);
        $stmt->bindParam(':prenom', $prenom);
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':statut', $statut);
        
        return $stmt->execute();
    } catch (PDOException $e) {
        error_log("Erreur modification adhérent : " . $e->getMessage());
        return false;
    }
}

/**
 * Supprime un adhérent (seulement si pas d'emprunts actifs)
 */
function supprimerAdherent($id) {
    global $connexion;
    
    try {
        // Vérifier qu'il n'y a pas d'emprunts actifs
        $stmt = $connexion->prepare("SELECT COUNT(*) as nb FROM emprunt WHERE adherent_id = :id AND Statut_Emprunt IN ('emprunté', 'en retard')");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        if ($stmt->fetch()['nb'] > 0) {
            return false; // Ne peut pas supprimer, a des emprunts actifs
        }
        
        $stmt = $connexion->prepare("DELETE FROM adherent WHERE id = :id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        
        return $stmt->execute();
    } catch (PDOException $e) {
        error_log("Erreur suppression adhérent : " . $e->getMessage());
        return false;
    }
}

// =============================================
// FONCTIONS POUR LES MÉDIAS/STOCK
// =============================================

/**
 * Récupère tous les médias avec leurs informations de disponibilité
 */
function getMediasAvecDisponibilite($type = null, $search = null, $disponibilite = null, $limit = null, $offset = 0) {
    global $connexion;
    
    try {
        $sql = "SELECT m.*, t.Nom as type_nom,
                       COUNT(ex.id) as total_exemplaires,
                       SUM(CASE WHEN ex.disponible = 1 THEN 1 ELSE 0 END) as exemplaires_disponibles
                FROM media m
                LEFT JOIN type t ON m.type_id = t.id
                LEFT JOIN exemplaire ex ON m.id = ex.media_id
                WHERE 1=1";
        
        $params = [];
        
        if ($type) {
            $sql .= " AND m.type_id = :type";
            $params['type'] = $type;
        }
        
        if ($search) {
            $sql .= " AND (m.Titre LIKE :search OR m.Auteur LIKE :search)";
            $params['search'] = "%$search%";
        }
        
        $sql .= " GROUP BY m.id";
        
        if ($disponibilite === 'disponible') {
            $sql .= " HAVING exemplaires_disponibles > 0";
        } elseif ($disponibilite === 'indisponible') {
            $sql .= " HAVING exemplaires_disponibles = 0";
        }
        
        $sql .= " ORDER BY m.Titre";
        
        if ($limit) {
            $sql .= " LIMIT :limit OFFSET :offset";
            $params['limit'] = $limit;
            $params['offset'] = $offset;
        }
        
        $stmt = $connexion->prepare($sql);
        
        foreach ($params as $key => $value) {
            if ($key === 'limit' || $key === 'offset') {
                $stmt->bindValue(":$key", $value, PDO::PARAM_INT);
            } else {
                $stmt->bindValue(":$key", $value);
            }
        }
        
        $stmt->execute();
        return $stmt->fetchAll();
    } catch (PDOException $e) {
        error_log("Erreur récupération médias : " . $e->getMessage());
        return [];
    }
}

/**
 * Récupère tous les types de médias
 */
function getTypesMedia() {
    global $connexion;
    
    try {
        $stmt = $connexion->query("SELECT * FROM type ORDER BY Nom");
        return $stmt->fetchAll();
    } catch (PDOException $e) {
        error_log("Erreur récupération types : " . $e->getMessage());
        return [];
    }
}

/**
 * Ajoute un nouveau média avec ses exemplaires
 */
function ajouterMedia($titre, $auteur, $editeur, $dateParution, $genre, $typeId, $etatConservation, $nbExemplaires = 1) {
    global $connexion;
    
    try {
        $connexion->beginTransaction();
        
        // Insérer le média
        $sql = "INSERT INTO media (Titre, Auteur, Editeur, Date_Parution, Genre, etat_Conservation, type_id) 
                VALUES (:titre, :auteur, :editeur, :dateParution, :genre, :etat, :typeId)";
        
        $stmt = $connexion->prepare($sql);
        $stmt->bindParam(':titre', $titre);
        $stmt->bindParam(':auteur', $auteur);
        $stmt->bindParam(':editeur', $editeur);
        $stmt->bindParam(':dateParution', $dateParution);
        $stmt->bindParam(':genre', $genre);
        $stmt->bindParam(':etat', $etatConservation);
        $stmt->bindParam(':typeId', $typeId, PDO::PARAM_INT);
        
        $stmt->execute();
        $mediaId = $connexion->lastInsertId();
        
        // Créer les exemplaires
        for ($i = 1; $i <= $nbExemplaires; $i++) {
            $sqlEx = "INSERT INTO exemplaire (media_id, numero_exemplaire, etat_conservation, disponible, date_acquisition) 
                      VALUES (:mediaId, :numero, :etat, 1, CURDATE())";
            
            $stmtEx = $connexion->prepare($sqlEx);
            $stmtEx->bindParam(':mediaId', $mediaId, PDO::PARAM_INT);
            $stmtEx->bindParam(':numero', $i, PDO::PARAM_INT);
            $stmtEx->bindParam(':etat', $etatConservation);
            $stmtEx->execute();
        }
        
        $connexion->commit();
        return $mediaId;
    } catch (PDOException $e) {
        $connexion->rollBack();
        error_log("Erreur ajout média : " . $e->getMessage());
        return false;
    }
}

// =============================================
// FONCTIONS POUR LES EMPRUNTS
// =============================================

/**
 * Récupère tous les emprunts avec filtres
 */
function getEmprunts($statut = null, $search = null, $limit = null, $offset = 0) {
    global $connexion;
    
    try {
        $sql = "SELECT e.*, m.Titre, m.Auteur,
                       CONCAT(a.Prenom, ' ', a.Nom) as emprunteur_nom,
                       a.Email as emprunteur_email,
                       ex.numero_exemplaire,
                       DATEDIFF(CURDATE(), e.Date_Retour_Prévue) as jours_retard
                FROM emprunt e
                JOIN media m ON e.media_id = m.id
                JOIN adherent a ON e.adherent_id = a.id
                JOIN exemplaire ex ON e.exemplaire_id = ex.id
                WHERE 1=1";
        
        $params = [];
        
        if ($statut) {
            $sql .= " AND e.Statut_Emprunt = :statut";
            $params['statut'] = $statut;
        }
        
        if ($search) {
            $sql .= " AND (m.Titre LIKE :search OR a.Nom LIKE :search OR a.Prenom LIKE :search)";
            $params['search'] = "%$search%";
        }
        
        $sql .= " ORDER BY e.Date_Emprunt DESC";
        
        if ($limit) {
            $sql .= " LIMIT :limit OFFSET :offset";
            $params['limit'] = $limit;
            $params['offset'] = $offset;
        }
        
        $stmt = $connexion->prepare($sql);
        
        foreach ($params as $key => $value) {
            if ($key === 'limit' || $key === 'offset') {
                $stmt->bindValue(":$key", $value, PDO::PARAM_INT);
            } else {
                $stmt->bindValue(":$key", $value);
            }
        }
        
        $stmt->execute();
        return $stmt->fetchAll();
    } catch (PDOException $e) {
        error_log("Erreur récupération emprunts : " . $e->getMessage());
        return [];
    }
}

/**
 * Crée un nouvel emprunt en utilisant la procédure stockée
 */
function creerEmprunt($mediaId, $adherentId, $dureeJours = null) {
    global $connexion;
    
    try {
        if (!$dureeJours) {
            // Récupérer le type de média pour déterminer la durée
            $stmt = $connexion->prepare("SELECT type_id FROM media WHERE id = :mediaId");
            $stmt->bindParam(':mediaId', $mediaId, PDO::PARAM_INT);
            $stmt->execute();
            $typeId = $stmt->fetch()['type_id'];
            
            $dureeJours = getDureeEmprunt($typeId);
        }
        
        $stmt = $connexion->prepare("CALL EmpruntMedia(:mediaId, :adherentId, :duree)");
        $stmt->bindParam(':mediaId', $mediaId, PDO::PARAM_INT);
        $stmt->bindParam(':adherentId', $adherentId, PDO::PARAM_INT);
        $stmt->bindParam(':duree', $dureeJours, PDO::PARAM_INT);
        
        $stmt->execute();
        $result = $stmt->fetch();
        
        return $result['Message'] === 'Emprunt créé avec succès';
    } catch (PDOException $e) {
        error_log("Erreur création emprunt : " . $e->getMessage());
        return false;
    }
}

/**
 * Marque un emprunt comme rendu en utilisant la procédure stockée
 */
function retournerEmprunt($empruntId) {
    global $connexion;
    
    try {
        $stmt = $connexion->prepare("CALL RetourMedia(:empruntId)");
        $stmt->bindParam(':empruntId', $empruntId, PDO::PARAM_INT);
        
        $stmt->execute();
        $result = $stmt->fetch();
        
        return $result['Message'] === 'Retour effectué avec succès';
    } catch (PDOException $e) {
        error_log("Erreur retour emprunt : " . $e->getMessage());
        return false;
    }
}

/**
 * Prolonge un emprunt
 */
function prolongerEmprunt($empruntId, $nouveauxJours = 14) {
    global $connexion;
    
    try {
        $sql = "UPDATE emprunt 
                SET Date_Retour_Prévue = DATE_ADD(Date_Retour_Prévue, INTERVAL :jours DAY),
                    Statut_Emprunt = 'emprunté'
                WHERE ID_Emprunt = :empruntId";
        
        $stmt = $connexion->prepare($sql);
        $stmt->bindParam(':empruntId', $empruntId, PDO::PARAM_INT);
        $stmt->bindParam(':jours', $nouveauxJours, PDO::PARAM_INT);
        
        return $stmt->execute();
    } catch (PDOException $e) {
        error_log("Erreur prolongation emprunt : " . $e->getMessage());
        return false;
    }
}

/**
 * Met à jour automatiquement les statuts des emprunts en retard
 */
function mettreAJourStatutsEmprunts() {
    global $connexion;
    
    try {
        $sql = "UPDATE emprunt 
                SET Statut_Emprunt = 'en retard' 
                WHERE Date_Retour_Prévue < CURDATE() 
                AND Statut_Emprunt = 'emprunté'";
        
        $stmt = $connexion->prepare($sql);
        return $stmt->execute();
    } catch (PDOException $e) {
        error_log("Erreur mise à jour statuts : " . $e->getMessage());
        return false;
    }
}

/**
 * Récupère les médias disponibles pour un nouvel emprunt
 */
function getMediasDisponibles() {
    global $connexion;
    
    try {
        $sql = "SELECT DISTINCT m.id, m.Titre, m.Auteur, t.Nom as type_nom
                FROM media m
                JOIN type t ON m.type_id = t.id
                JOIN exemplaire ex ON m.id = ex.media_id
                WHERE ex.disponible = 1
                ORDER BY m.Titre";
        
        $stmt = $connexion->query($sql);
        return $stmt->fetchAll();
    } catch (PDOException $e) {
        error_log("Erreur médias disponibles : " . $e->getMessage());
        return [];
    }
}

/**
 * Récupère les adhérents actifs pour un nouvel emprunt
 */
function getAdherentsActifs() {
    global $connexion;
    
    try {
        $sql = "SELECT id, CONCAT(Prenom, ' ', Nom) as nom_complet, Email
                FROM adherent 
                WHERE Statut = 'actif'
                ORDER BY Nom, Prenom";
        
        $stmt = $connexion->query($sql);
        return $stmt->fetchAll();
    } catch (PDOException $e) {
        error_log("Erreur adhérents actifs : " . $e->getMessage());
        return [];
    }
}

?>