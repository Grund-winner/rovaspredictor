<?php
/**
 * aviator.php - Aviator/Astronaut Prediction Backend
 * Appelle crash gateway + gpt.php (IA gratuit)
 */

// CORS — restricted to Render domain only
$allowedOrigin = 'https://rovasb-app.onrender.com';
$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($requestOrigin && $requestOrigin !== $allowedOrigin) {
    http_response_code(403);
    exit('Forbidden origin');
}
header("Access-Control-Allow-Origin: " . $allowedOrigin);
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

/* =========================================
   CRASH GATEWAY AUTH + HISTORY
   ========================================= */
function fetchCrashHistorySecure($authToken) {
    $authUrl = "https://crash-gateway-grm-cr.100hp.app/user/auth";
    $ch = curl_init($authUrl);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_HTTPHEADER => [
            "auth-token: {$authToken}",
            "Content-Type: application/json"
        ]
    ]);
    $authResp = curl_exec($ch);
    curl_close($ch);

    $auth = json_decode($authResp, true);
    if (!$auth || empty($auth['sessionId']) || empty($auth['customerId'])) {
        return [];
    }

    $sessionId = trim($auth['sessionId']);
    $customerId = trim($auth['customerId']);

    $historyUrl = "https://crash-gateway-grm-cr.100hp.app/history";
    $headers = [
        "accept: application/json, text/plain, */*",
        "origin: https://1play.gamedev-tech.cc",
        "referer: https://1play.gamedev-tech.cc/",
        "customer-id: {$customerId}",
        "session-id: {$sessionId}",
        "user-agent: Mozilla/5.0"
    ];

    $ch = curl_init($historyUrl);
    curl_setopt_array($ch, [
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_CONNECTTIMEOUT => 5
    ]);
    $resp = curl_exec($ch);
    curl_close($ch);

    $history = json_decode($resp, true);
    return is_array($history) ? $history : [];
}

/* =========================================
   EXTRACT VALUES
   ========================================= */
function extractFinalValues($data) {
    $vals = [];
    foreach ($data as $item) {
        if (isset($item['finalValues']) && is_array($item['finalValues'])) {
            foreach ($item['finalValues'] as $v) {
                if (is_numeric($v)) $vals[] = (float)$v;
            }
        }
    }
    return json_encode($vals);
}

/* =========================================
   AI PROMPT
   ========================================= */
function makePrompt($history) {
    return "You are an offset guessing API.\n\nHistory:\n"
        . extractFinalValues($history)
        . "\n\nRules:\n"
        . "- Predict only ONE number\n"
        . "- Range: 5.00 - 8.00\n"
        . "- Two decimal places\n"
        . "- Avoid repeating extreme highs\n"
        . "- If 3 small numbers appear in a row, favor >7.00\n"
        . "- Return ONLY the number (no text)\n"
        . "NOTE THIS - The minimum odds should not be above 3X+\n"
        . ", The maximum odds can be 4.8X+ or 5X+, no problem";
}

/* =========================================
   CALL LOCAL GPT
   ========================================= */
function callGPT($message) {
    $baseDir = dirname($_SERVER['SCRIPT_NAME']);
    $baseUrl = "http://" . $_SERVER['HTTP_HOST'] . ($baseDir === '/' || $baseDir === '\\' ? '' : $baseDir);

    $ch = curl_init($baseUrl . "/gpt.php");
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POSTFIELDS => http_build_query(["prompt" => $message]),
        CURLOPT_TIMEOUT => 15,
        CURLOPT_CONNECTTIMEOUT => 5
    ]);
    $resp = curl_exec($ch);
    curl_close($ch);
    return $resp ?: "";
}

/* =========================================
   INPUT
   ========================================= */
// Input — token from env var ONLY (no GET parameter exposure)
$authToken = getenv('CRASH_GATEWAY_TOKEN') ?: '';
if (!$authToken) {
    echo json_encode(["error" => "Crash gateway token not configured", "status" => "error"]);
    exit;
}

$language = $_GET['language'] ?? 'en';
$pid = $_GET['pid'] ?? '1win';

/* =========================================
   FETCH + PREDICT
   ========================================= */
$history = fetchCrashHistorySecure($authToken);
if (!$history) {
    echo json_encode(["error" => "Failed to fetch crash history"]);
    exit;
}

$prompt = makePrompt($history);
$response = callGPT($prompt);

$decoded = json_decode($response, true);
$ai_prediction = is_array($decoded) && isset($decoded["answer"])
    ? trim($decoded["answer"])
    : trim($response);

// Extraire le nombre
if (preg_match('/(\d+\.?\d*)/', $ai_prediction, $m)) {
    $ai_prediction = round((float)$m[1], 2);
} else {
    $ai_prediction = null;
}

// Fallback manuel
$ranges = [
    ["min" => 5.00, "max" => 5.80, "prob" => 0.30],
    ["min" => 5.81, "max" => 6.60, "prob" => 0.35],
    ["min" => 6.61, "max" => 7.30, "prob" => 0.20],
    ["min" => 7.31, "max" => 8.00, "prob" => 0.15],
];
$pick = $ranges[array_rand($ranges)];
$manual_coeff = round(mt_rand($pick["min"] * 100, $pick["max"] * 100) / 100, 2);
$confidence = min(100, intval($pick["prob"] * 100) + 60);

$manual_prediction = [
    "coeff" => ($manual_coeff >= 3) ? round(mt_rand(230, 300) / 100, 2) : $manual_coeff,
    "confidence" => $confidence
];

// Time window
$tzParam = $_GET['t'] ?? null;
try {
    $tz = $tzParam ? new DateTimeZone($tzParam) : new DateTimeZone(date_default_timezone_get());
} catch (Exception $e) {
    $tz = new DateTimeZone(date_default_timezone_get());
}
$now = new DateTime("now", $tz);
$nextMin = (clone $now)->modify("+2 minutes");
$time_window = $nextMin->format("H:i");

echo json_encode([
    "ai_prediction" => $ai_prediction,
    "manual_prediction" => $manual_prediction,
    "history" => $history,
    "time_window" => $time_window,
    "timezone" => $tz->getName(),
    "language" => $language,
    "pid" => $pid,
    "status" => "ok"
]);
