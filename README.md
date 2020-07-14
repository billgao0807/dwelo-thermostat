# dwelo-lights
Bridge Dwelo smarthome to HomeKit with HomeBridge

## Configuration
The values of "token", "home" and "lights" are specific to your Dwelo Account. To get them, follow these steps (only needs to be done once).

### Getting "token" value
1. Open Chrome.
2. Open Developer Tools (View/Developer/Developer Tools).
3. Click on 'Network' tab. Make sure 'Preserve Log' is checked.
4. In the 'Filter' box, enter `token`
5. Go to `https://web.dwelo.com`, and click 'Sign In'. Log into your account.
6. One network call (beginning with `command/`) will appear in the Dev Tools window. Click on it.
7. In the Headers tab, under Request Headers, look for the "authorization" header.  Copy the long string of characters after `Token ` (it's around 199 characters long and has no spaces). This is your `"token"` in `config.json`.

### Getting "home" value
1. Go to `https://web.dwelo.com`, and click 'Sign In'. Log into your account.
2. Look at the browser address bar and you'll see `https://web.dwelo.com/units/XXXXXX?community=123`.  Copy the numbers after the `units/`.  It should be 6 characters long.

### Getting the "lights" value
1. Go to `https://web.dwelo.com`, and click 'Sign In'. Log into your account.
2. Hover your mouse over one of the listed lights.  You should see a tooltip saying "Light ID: XXXXXX".  Those numbers are your light ID.  It should be 6 characters long.
