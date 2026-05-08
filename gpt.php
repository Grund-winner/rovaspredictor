<?php
/**
 * GPT.php - IA Prediction Backend (GRATUIT)
 * Utilise WriteCream API (pas de clé payante requise)
 * Fallback: LiveChatAI puis génération locale
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
$allowedOrigins = ['https://rovasb-app.onrender.com'];
$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($requestOrigin && !in_array($requestOrigin, $allowedOrigins)) {
    http_response_code(403);
    exit('Forbidden origin');
}
header("Access-Control-Allow-Origin: https://rovasb-app.onrender.com");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

/* =========================================
   WRITECREAM API (GRATUIT)
   ========================================= */
function generateRandomHeaders() {
    $browsers = [
        '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
        '"Microsoft Edge";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
        '"Firefox";v="122", "Not=A?Brand";v="24", "Chromium";v="122"',
    ];
    $platforms = ['"Windows"', '"macOS"', '"Linux"'];
    $languages = [
        'en-US,en;q=0.9,es;q=0.8',
        'en-GB,en;q=0.9,fr;q=0.8,de;q=0.7',
        'de-DE,de;q=0.9,en;q=0.8,fr;q=0.7',
    ];
    $chromeVersion = rand(110, 125);

    return [
        "accept: */*",
        "accept-language: " . $languages[array_rand($languages)],
        "sec-ch-ua: " . $browsers[array_rand($browsers)],
        "sec-ch-ua-mobile: ?0",
        "sec-ch-ua-platform: " . $platforms[array_rand($platforms)],
        "sec-fetch-dest: empty",
        "sec-fetch-mode: cors",
        "sec-fetch-site: same-origin",
        "origin: https://www.writecream.com",
        "referer: https://www.writecream.com/ai-chat/",
        "user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/$chromeVersion.0.0.0 Safari/537.36"
    ];
}

function callWritecreamAPI($message) {
    $fields = [
        "action" => "generate_chat",
        "query" => json_encode([
            ["role" => "system", "content" => "You are a helpful and informative AI assistant."],
            ["role" => "user", "content" => $message]
        ]),
        "link" => "writecream.com"
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://www.writecream.com/wp-admin/admin-ajax.php");
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $fields);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, generateRandomHeaders());
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);

    $response = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($status != 200) return null;

    $data = json_decode($response, true);
    if (isset($data['data']) && is_string($data['data'])) return $data['data'];
    if (isset($data['data']['response_content'])) return $data['data']['response_content'];
    if (isset($data['message'])) return $data['message'];
    if (isset($data['content'])) return $data['content'];
    if (isset($data['text'])) return $data['text'];
    if (isset($data['result'])) return $data['result'];

    return null;
}

/* =========================================
   LIVECHAT AI (FALLBACK GRATUIT)
   ========================================= */
function callLiveChatAI($prompt) {
    $url = "https://app.livechatai.com/api/free-tools/get-results";
    $payload = [
        "content" => $prompt,
        "contentSecond" => "Just do whats asked.",
        "contentThird" => "NO Creativity, JUST DO WHAT ASKED. IF IT SAYS TO GIVE A NUMBER JUST GIVE A NUMBER.",
        "contentFourth" => "Short",
        "charactersMinimumLength" => ["content" => 3],
        "charactersLimits" => ["content" => 3000],
        "toolId" => "aiAnswersGenerator"
    ];
    $headers = [
        "accept: */*",
        "content-type: application/json",
        "origin: https://app.livechatai.com",
        "referer: https://app.livechatai.com/free-tools/en/ai-answers-generator",
        "user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);

    $response = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($status !== 200) return null;

    $data = json_decode($response, true);
    if (isset($data['text'])) return $data['text'];

    return null;
}

/* =========================================
   DEEPSEEK (2EME FALLBACK GRATUIT)
   ========================================= */
function callDeepSeek($message) {
    $homepage = @file_get_contents("https://chat-deep.ai/deepseek-chat/");
    if ($homepage === false) return null;

    if (preg_match('/data-nonce="([^"]+)"/', $homepage, $matches)) {
        $nonce = $matches[1];
    } else {
        return null;
    }

    $boundary = "----WebKitFormBoundary" . bin2hex(random_bytes(8));
    $eol = "\r\n";
    $body = '';
    $fields = [
        "action" => "deepseek_chat",
        "message" => $message,
        "model" => "deepseek-reasoner",
        "nonce" => $nonce,
        "save_conversation" => "0",
        "session_only" => "1"
    ];
    foreach ($fields as $name => $value) {
        $body .= "--" . $boundary . $eol;
        $body .= "Content-Disposition: form-data; name=\"$name\"$eol$eol";
        $body .= $value . $eol;
    }
    $body .= "--" . $boundary . "--" . $eol;

    $ch = curl_init("https://chat-deep.ai/wp-admin/admin-ajax.php");
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "accept: */*",
        "content-type: multipart/form-data; boundary=$boundary",
        "sec-fetch-dest: empty",
        "sec-fetch-mode: cors",
        "sec-fetch-site: same-origin",
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    curl_setopt($ch, CURLOPT_REFERER, "https://chat-deep.ai/");
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);

    $response = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($response, true);
    if (isset($data['data']['response'])) return $data['data']['response'];

    return null;
}

/* =========================================
   MAIN LOGIC
   ========================================= */
$prompt = $_GET['prompt'] ?? $_POST['prompt'] ?? null;

if (!$prompt) {
    echo json_encode(["answer" => "No prompt provided"], JSON_UNESCAPED_UNICODE);
    exit;
}

// Essai 1: WriteCream (principal)
$answer = callWritecreamAPI($prompt);

// Essai 2: DeepSeek (fallback)
if (!$answer) {
    $answer = callDeepSeek($prompt);
}

// Essai 3: LiveChatAI (dernier fallback)
if (!$answer) {
    $answer = callLiveChatAI($prompt);
}

// Fallback local si tout échoue
if (!$answer) {
    $answer = "Service temporarily unavailable";
}

header('Content-Type: application/json');
echo json_encode(["answer" => $answer], JSON_UNESCAPED_UNICODE);
