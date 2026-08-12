// NativeWind v4 needs its own Metro transformer to compile `global.css` into
// the style registry. Without this file every `className` in the app is inert:
// the components still render, but with no styles at all — which is why the
// feed's empty state was drawing black text on a near-black background.
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
