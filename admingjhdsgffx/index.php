<?php
session_start();

// Check if user is logged in via the main admin panel
// The admin panel sets $_SESSION['admin_logged_in'] = true
// If not logged in, redirect to main admin login
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    // Redirect to main admin login page
    header("Location: ../../index.php");
    exit();
}

// Already logged in, go to homepage
header("Location: homepage.html");
exit();
?>
