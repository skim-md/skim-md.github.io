/* AUTO-SYNCED from the Skim extension (src/emoji.js). Do not edit here; run `npm run sync`. */
// Emoji shortcodes: `:rocket:` -> 🚀 via a small curated map, resolved to the
// Unicode codepoint (never an image set — Apple Color Emoji is proprietary and
// the OS font stack already ships color emoji everywhere). Deliberately covers
// the common GitHub-flavored shortcodes, not the full ~1800 gemoji set: a
// hand-picked list keeps the bundle tiny and avoids surprising matches.
//
// Keys are lowercase [a-z0-9_+-]. Aliases (e.g. +1/thumbsup) both point at the
// same glyph.
export const EMOJI = {
  // reactions / hands
  '+1': '👍', 'thumbsup': '👍', '-1': '👎', 'thumbsdown': '👎',
  'ok_hand': '👌', 'wave': '👋', 'clap': '👏', 'raised_hands': '🙌',
  'pray': '🙏', 'muscle': '💪', 'point_up': '☝️', 'point_down': '👇',
  'point_left': '👈', 'point_right': '👉', 'v': '✌️', 'crossed_fingers': '🤞',
  'handshake': '🤝', 'fist': '✊', 'punch': '👊', 'writing_hand': '✍️',
  // faces
  'smile': '😄', 'smiley': '😃', 'grin': '😁', 'laughing': '😆', 'joy': '😂',
  'rofl': '🤣', 'wink': '😉', 'blush': '😊', 'slight_smile': '🙂',
  'thinking': '🤔', 'neutral_face': '😐', 'expressionless': '😑',
  'sunglasses': '😎', 'sweat_smile': '😅', 'cry': '😢', 'sob': '😭',
  'rage': '😡', 'angry': '😠', 'fearful': '😨', 'scream': '😱',
  'confused': '😕', 'worried': '😟', 'grimacing': '😬', 'astonished': '😲',
  'heart_eyes': '😍', 'kissing_heart': '😘', 'yum': '😋', 'sleeping': '😴',
  'nerd_face': '🤓', 'exploding_head': '🤯', 'partying_face': '🥳',
  'face_with_monocle': '🧐', 'shushing_face': '🤫', 'zany_face': '🤪',
  'upside_down_face': '🙃', 'melting_face': '🫠', 'salute': '🫡',
  // symbols / status
  'heart': '❤️', 'yellow_heart': '💛', 'green_heart': '💚', 'blue_heart': '💙',
  'purple_heart': '💜', 'broken_heart': '💔', 'sparkling_heart': '💖',
  'white_check_mark': '✅', 'heavy_check_mark': '✔️', 'ballot_box_with_check': '☑️',
  'x': '❌', 'negative_squared_cross_mark': '❎', 'heavy_multiplication_x': '✖️',
  'warning': '⚠️', 'no_entry': '⛔', 'no_entry_sign': '🚫',
  'question': '❓', 'grey_question': '❔', 'exclamation': '❗', 'grey_exclamation': '❕',
  'bangbang': '‼️', 'interrobang': '⁉️', 'information_source': 'ℹ️',
  'recycle': '♻️', 'sparkle': '❇️', 'star': '⭐', 'star2': '🌟', 'stars': '✨',
  'sparkles': '✨', 'dizzy': '💫', 'boom': '💥', 'collision': '💥', 'fire': '🔥',
  'zap': '⚡', 'bulb': '💡', '100': '💯', 'heavy_plus_sign': '➕',
  'heavy_minus_sign': '➖', 'heavy_check': '✔️', 'radioactive': '☢️',
  'white_circle': '⚪', 'red_circle': '🔴', 'large_blue_circle': '🔵',
  'green_circle': '🟢', 'yellow_circle': '🟡', 'orange_circle': '🟠',
  // arrows
  'arrow_right': '➡️', 'arrow_left': '⬅️', 'arrow_up': '⬆️', 'arrow_down': '⬇️',
  'arrow_upper_right': '↗️', 'arrow_lower_right': '↘️', 'arrow_forward': '▶️',
  'rocket': '🚀', 'airplane': '✈️', 'car': '🚗', 'checkered_flag': '🏁',
  // objects / dev
  'tada': '🎉', 'confetti_ball': '🎊', 'balloon': '🎈', 'gift': '🎁',
  'trophy': '🏆', 'medal': '🏅', 'first_place': '🥇', 'crown': '👑', 'gem': '💎',
  'dart': '🎯', 'chart_with_upwards_trend': '📈', 'chart_with_downwards_trend': '📉',
  'bar_chart': '📊', 'moneybag': '💰', 'dollar': '💵', 'credit_card': '💳',
  'book': '📖', 'books': '📚', 'bookmark': '🔖', 'memo': '📝', 'pencil': '📝',
  'pencil2': '✏️', 'clipboard': '📋', 'page_facing_up': '📄', 'newspaper': '📰',
  'wrench': '🔧', 'hammer': '🔨', 'hammer_and_wrench': '🛠️', 'gear': '⚙️',
  'nut_and_bolt': '🔩', 'toolbox': '🧰', 'bug': '🐛', 'ant': '🐜',
  'package': '📦', 'label': '🏷️', 'link': '🔗', 'paperclip': '📎',
  'lock': '🔒', 'unlock': '🔓', 'key': '🔑', 'shield': '🛡️',
  'mag': '🔍', 'mag_right': '🔎', 'telescope': '🔭', 'microscope': '🔬',
  'bell': '🔔', 'no_bell': '🔕', 'loudspeaker': '📢', 'mega': '📣',
  'calendar': '📅', 'date': '📆', 'alarm_clock': '⏰', 'hourglass': '⌛',
  'hourglass_flowing_sand': '⏳', 'watch': '⌚', 'stopwatch': '⏱️',
  'email': '📧', 'envelope': '✉️', 'inbox_tray': '📥', 'outbox_tray': '📤',
  'computer': '💻', 'desktop_computer': '🖥️', 'keyboard': '⌨️', 'mouse': '🖱️',
  'floppy_disk': '💾', 'cd': '💿', 'battery': '🔋', 'electric_plug': '🔌',
  'satellite': '🛰️', 'robot': '🤖', 'brain': '🧠', 'dna': '🧬',
  'art': '🎨', 'camera': '📷', 'video_camera': '📹', 'movie_camera': '🎥',
  'musical_note': '🎵', 'headphones': '🎧', 'game_die': '🎲', 'jigsaw': '🧩',
  // nature / food / misc
  'rainbow': '🌈', 'sunny': '☀️', 'cloud': '☁️', 'snowflake': '❄️',
  'ocean': '🌊', 'earth_americas': '🌎', 'globe_with_meridians': '🌐',
  'seedling': '🌱', 'herb': '🌿', 'four_leaf_clover': '🍀', 'leaves': '🍃',
  'evergreen_tree': '🌲', 'cactus': '🌵', 'mountain': '⛰️', 'volcano': '🌋',
  'coffee': '☕', 'tea': '🍵', 'beer': '🍺', 'beers': '🍻', 'wine_glass': '🍷',
  'pizza': '🍕', 'hamburger': '🍔', 'taco': '🌮', 'cake': '🍰', 'cookie': '🍪',
  'doughnut': '🍩', 'apple': '🍎', 'lemon': '🍋', 'hot_pepper': '🌶️',
  'eyes': '👀', 'eye': '👁️', 'skull': '💀', 'ghost': '👻', 'alien': '👽',
  'poop': '💩', 'hankey': '💩', 'clown_face': '🤡', 'snowman': '⛄',
  'construction': '🚧', 'anchor': '⚓', 'compass': '🧭', 'flashlight': '🔦',
  'candle': '🕯️', 'wastebasket': '🗑️', 'pushpin': '📌', 'round_pushpin': '📍',
  'scroll': '📜', 'scissors': '✂️', 'straight_ruler': '📏', 'triangular_ruler': '📐',
  'test_tube': '🧪', 'petri_dish': '🧫', 'magnet': '🧲', 'thread': '🧵',
  'sos': '🆘', 'new': '🆕', 'free': '🆓', 'ok': '🆗', 'up': '🆙',
  'no_good': '🙅', 'shrug': '🤷', 'facepalm': '🤦', 'tophat': '🎩',
  'sunrise': '🌅', 'city_sunset': '🌇', 'night_with_stars': '🌃', 'milky_way': '🌌',
  'crescent_moon': '🌙', 'full_moon': '🌕', 'zzz': '💤', 'dash': '💨',
  'speech_balloon': '💬', 'thought_balloon': '💭', 'eyes_left': '👀',
};
