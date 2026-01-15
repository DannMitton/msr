# Word Card Face Update Instructions

## Summary

This update restructures the word card face to display:
1. **IPA** (top, discreet styling)
2. **Cyrillic** (middle, large, dominant)
3. **Divider line**
4. **English translation** (bottom, italic, discreet)

## Files Included

1. `index.html` - Updated main file with:
   - New `lookupGloss()` function
   - Updated `lookupStress()` to handle new dictionary format
   - Restructured card face HTML (IPA top, cyrillic middle, translation bottom)

2. `css-additions.css` - New styles for card face structure

## Installation Steps

### Step 1: Replace index.html
Upload `index.html` to GitHub, replacing the existing file.

### Step 2: Add CSS to styles.css
1. Go to `css/styles.css` in GitHub
2. Click edit (pencil icon)
3. Scroll to the end of the file
4. Paste the contents of `css-additions.css`
5. Commit with message: "Add new card face structure styles"

### Step 3: Test
1. Go to https://dannmitton.github.io/msr/
2. Wait 1-2 minutes for deployment
3. Hard refresh (Cmd+Shift+R)
4. Type a word and check:
   - IPA appears at top in grey
   - Cyrillic appears large in middle
   - Translation appears in italic grey below divider

## What Changed

### JavaScript (index.html)

**New function added:**
```javascript
function lookupGloss(word) {
    // Returns English translation from OpenRussian dictionary
}
```

**Updated lookupStress:**
- Now handles both old format (`{ word: stressIndex }`) and new format (`{ word: { stress, gloss } }`)

**Card face template restructured:**
- `<div class="ipa-top">` moved above cyrillic
- `<div class="card-divider">` added between cyrillic and translation
- `<div class="translation">` added at bottom

### CSS (styles.css additions)

- `.ipa-top` - Discreet styling for top IPA
- `.card-divider` - Subtle horizontal line
- `.translation` - Italic, same colour as IPA
- Flexbox layout for proper element ordering
