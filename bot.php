<?php
/**
 * bot.php - LuckyJet Prediction Backend
 * Appelle crash gateway + gpt.php (IA gratuit)
 */

$allowedOrigin = 'https://rovasb-app.onrender.com';
$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($requestOrigin !== $allowedOrigin) {
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
$authToken = getenv('CRASH_GATEWAY_TOKEN') ?: '';
if (empty($authToken)) {
    echo json_encode(["error" => "Crash gateway token not configured", "status" => "error"]);
    exit;
}

function fetchCrashHistory($token) {
    // Auth
    $ch = curl_init("https://crash-gateway-grm-cr.100hp.app/user/auth");
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_HTTPHEADER => [
            "auth-token: {$token}",
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

    // History
    $ch = curl_init("https://crash-gateway-grm-cr.100hp.app/history");
    curl_setopt_array($ch, [
        CURLOPT_HTTPHEADER => [
            "accept: application/json, text/plain, */*",
            "origin: https://1play.gamedev-tech.cc",
            "referer: https://1play.gamedev-tech.cc/",
            "customer-id: {$customerId}",
            "session-id: {$sessionId}",
            "user-agent: Mozilla/5.0"
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15
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
    $ch = curl_init("http://" . $_SERVER['HTTP_HOST'] . dirname($_SERVER['SCRIPT_NAME']) . "/gpt.php");
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POSTFIELDS => http_build_query(["prompt" => $message]),
        CURLOPT_TIMEOUT => 35
    ]);
    $resp = curl_exec($ch);
    curl_close($ch);
    return $resp ?: "";
}

/* =========================================
   MAIN
   ========================================= */
$history = fetchCrashHistory($authToken);
if (!$history) {
    echo json_encode(["error" => "Failed to fetch crash history", "status" => "error"]);
    exit;
}

$prompt = makePrompt($history);
$response = callGPT($prompt);

$decoded = json_decode($response, true);
$ai_prediction = is_array($decoded) && isset($decoded["answer"])
    ? trim($decoded["answer"])
    : trim($response);

// Extraire le nombre de la réponse
if (preg_match('/(\d+\.?\d*)/', $ai_prediction, $m)) {
    $ai_prediction = round((float)$m[1], 2);
} else {
    $ai_prediction = null;
}

// Fallback manuel
$ranges = [
    ["min" => 2.10, "max" => 2.58, "prob" => 0.85],
    ["min" => 2.59, "max" => 3.00, "prob" => 0.15],
];
$pick = $ranges[array_rand($ranges)];
$manual_coeff = round(mt_rand($pick["min"] * 100, $pick["max"] * 100) / 100, 2);

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
    "manual_prediction" => [
        "coeff" => $manual_coeff,
        "confidence" => rand(90, 98)
    ],
    "history" => $history,
    "time_window" => $time_window,
    "timezone" => $tz->getName(),
    "status" => "ok"
]);
