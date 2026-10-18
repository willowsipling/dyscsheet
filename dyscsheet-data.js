// Everything dyscsheet says about its own buttons and symbols, in one place.
// The info strip, screen-reader descriptions and the reference card on docs.html all read from here,
// so a meaning edited once changes everywhere.
//
// keys: a shortcut as a list of keys, e.g. ['alt', 'R']. 'mod' is Cmd on a Mac and Ctrl elsewhere.
// Leave keys out when there's no shortcut.

window.DYSC = (() => {
  'use strict';

  // Wrap tools. code is the physical key (e.code) the Option/Alt shortcut listens for.
  const KINDS = {
    sqrt:  { label: '√',   name: 'Square root',     code: 'KeyR',   keys: ['alt', 'R'],
             means: 'Which number times itself gives this? Select cells, then press to put them under a root.' },
    frac:  { label: 'a/b', name: 'Fraction',        code: 'KeyF',   keys: ['alt', 'F'],
             means: 'The top divided by the bottom. Select cells, then press to put them over a fraction line.' },
    paren: { label: '( )', name: 'Big parentheses', code: 'KeyP',   keys: ['alt', 'P'],
             means: 'Groups things together. Work out what\'s inside first.' },
    sup:   { label: 'x²',  name: 'Exponent',        code: 'Digit6', keys: ['alt', '6'],
             means: 'Multiply the number by itself this many times. Written small and raised.' },
    sub:   { label: 'x₂',  name: 'Subscript',       code: 'Minus',  keys: ['alt', '−'],
             means: 'A label, not maths: x₂ just means "the second x". Written small and lowered.' },
    bar:   { label: 'x̄',   name: 'Bar',             code: 'KeyB',   keys: ['alt', 'B'],
             means: 'Puts a line over the cells. Usually means "the mean of".' },
    hat:   { label: 'p̂',   name: 'Hat',             code: 'KeyT',   keys: ['alt', 'T'],
             means: 'Puts a hat over the cells. Usually means "an estimate of" or "predicted".' },
    hl:    { label: 'Highlight', name: 'Highlight', code: 'KeyH',   keys: ['alt', 'H'],
             means: 'Colours the cells yellow so you can mark them. It doesn\'t change the maths.' },
  };

  const SYMBOLS = [
    { sym: 'α',  say: 'alpha',     means: 'The significance level: how unlikely a result has to be before you reject H₀ (often 0.05). Also the chance of a Type I error.' },
    { sym: 'β',  say: 'beta',      means: 'The chance of a Type II error: missing a real effect. In regression, it can also mean a slope.' },
    { sym: 'H₀', say: 'H-naught',  means: 'The null hypothesis: "nothing is going on", meaning no effect or no difference. It\'s what you test against.' },
    { sym: 'H₁', say: 'H-one',     means: 'The alternative (research) hypothesis: what you think is actually true.' },
    { sym: 'λ',  say: 'lambda',    means: 'The average rate something happens, like calls per hour. Used with the Poisson distribution.' },
    { sym: 'μ',  say: 'mu',        means: 'The population mean: the average of the whole population, not just your sample.' },
    { sym: 'p̂',  say: 'p-hat',     means: 'The sample proportion: the share of your sample with the trait (count ÷ sample size).' },
    { sym: 'π',  say: 'pi',        means: 'About 3.14159, the circle number. Some stats books also use it for the population proportion.' },
    { sym: 'ρ',  say: 'rho',       means: 'The population correlation: how closely two things move together, from −1 to 1.' },
    { sym: 'σ',  say: 'sigma',     means: 'The population standard deviation: how far values typically sit from the population mean.' },
    { sym: 'Σ',  say: 'capital sigma', means: 'Sum: add up everything that comes after it.' },
    { sym: 'tα', say: 't-alpha',   means: 'The critical t-value: the cutoff from the t-table for your α. If your t is further out than this, reject H₀.' },
    { sym: 'θ',  say: 'theta',     means: 'An angle in geometry. In stats, a stand-in for "some parameter".' },
    { sym: 'χ',  say: 'chi (rhymes with "sky")', means: 'Used in the chi-square (χ²) test, which compares the counts you got with the counts you expected.' },
    { sym: 'ŷ',  say: 'y-hat',     means: 'The predicted y: what the regression line says y should be.' },
    { sym: 'x̄',  say: 'x-bar',     means: 'The sample mean: the average of your sample (add the values, divide by how many).' },
    { sym: '±',  say: 'plus or minus', means: 'Do both: add it and subtract it. Often used for a margin of error.' },
    { sym: '÷',  say: 'divided by', means: 'Division.' },
    { sym: '×',  say: 'times',     means: 'Multiplication.' },
    { sym: '·',  say: 'times (dot)', means: 'Multiplication too. The dot can\'t be mistaken for the letter x.' },
    { sym: '≤',  say: 'less than or equal to', means: '"At most": this amount or less.' },
    { sym: '≥',  say: 'greater than or equal to', means: '"At least": this amount or more.' },
    { sym: '≠',  say: 'not equal to', means: 'The two sides are different.' },
    { sym: '≈',  say: 'approximately', means: 'Close to, but rounded.' },
    { sym: '∞',  say: 'infinity',  means: 'Goes on forever and never ends.' },
  ];

  // The other toolbar controls, by element id.
  const BUTTONS = {
    newSheet:     { name: 'New sheet', means: 'Clears everything and starts over. Save first!' },
    open:         { name: 'Open file', means: 'Loads work you saved before from a file on your computer.' },
    save:         { name: 'Save file', means: 'Saves your work as a file on your computer.' },
    print:        { name: 'Print / PDF', means: 'Prints your work, or saves it as a PDF.' },
    showFinished: { name: 'Render LaTeX/MathJax Output', means: 'Shows your work as finished, typeset maths below the sheet.' },
    undo:         { name: 'Undo', means: 'Takes back your last change.', keys: ['mod', 'Z'] },
    redo:         { name: 'Redo', means: 'Puts back the change you just undid.', keys: ['mod', 'shift', 'Z'] },
    cutBtn:       { name: 'Cut', means: 'Removes the selected cells and keeps a copy to paste.', keys: ['mod', 'X'] },
    copyBtn:      { name: 'Copy', means: 'Copies the selected cells so you can paste them somewhere else.', keys: ['mod', 'C'] },
    pasteBtn:     { name: 'Paste', means: 'Puts the cells you cut or copied at the cursor.', keys: ['mod', 'V'] },
    zoomOut:      { name: 'Zoom out', means: 'Makes the grid smaller. Only the grid changes, nothing else.' },
    zoomReset:    { name: 'Zoom 100%', means: 'Puts the grid back to its normal size.' },
    zoomIn:       { name: 'Zoom in', means: 'Makes the grid bigger. Only the grid changes, nothing else.' },
    tidyFrac:     { name: 'Tidy fraction', means: 'Removes leftover blank cells from a fraction and shrinks it to fit.' },
    addNoteAbove: { name: 'Add Text Row Above', means: 'Adds a line for words (notes) above this one.', keys: ['alt', 'shift', 'N'] },
    addLineAbove: { name: 'Add Number Row Above', means: 'Adds a blank maths line above this one.', keys: ['shift', 'Enter'] },
    colLeft:      { name: 'Add Column Left', means: 'Adds a blank column left of the cursor. Inside a root, this widens the root.', keys: ['shift', 'Space'] },
    colRight:     { name: 'Add Column Right', means: 'Adds a blank column right of the cursor. Inside a root, this widens the root.' },
    addLineBelow: { name: 'Add Number Row Below', means: 'Adds a blank maths line below this one.', keys: ['Enter'] },
    addNoteBelow: { name: 'Add Text Row Below', means: 'Adds a line for words (notes) below this one.', keys: ['alt', 'N'] },
  };

  // Shortcuts that don't belong to a button. Listed on docs.html.
  const MORE_KEYS = [
    { keys: ['Arrow keys'], means: 'Move the cursor. Up and down move between lines.' },
    { keys: ['shift', '← or →'], means: 'Select cells along the row.' },
    { keys: ['Home'], means: 'Jump to the start of the line.' },
    { keys: ['End'], means: 'Jump to just after the last thing on the line.' },
    { keys: ['Backspace'], means: 'Clear the cell before the cursor (or the selected cells).' },
    { keys: ['Delete'], means: 'Clear the cell at the cursor (or the selected cells).' },
    { keys: ['alt', 'Backspace'], means: 'Remove the column before the cursor, pulling everything after it left.' },
    { keys: ['mod', 'Y'], means: 'Redo (same as Redo above).' },
    { keys: ['Escape'], means: 'Cancel a wrap tool or selection. In a text row, go back to the maths.' },
  ];

  // Symbols that need HTML to look right (there's no Unicode subscript α).
  const SHOW = { 'tα': 't<sub>α</sub>', 'H₀': 'H<sub>0</sub>', 'H₁': 'H<sub>1</sub>' };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const show = (ch) => SHOW[ch] || esc(ch);

  // Words, not ⌘⌥⇧ glyphs, so nobody has to decode the shortcut.
  const MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const KEY_NAMES = { mod: MAC ? 'Cmd' : 'Ctrl', alt: MAC ? 'Option' : 'Alt', shift: 'Shift' };
  const NO_SHORTCUT = 'No Shortcut';
  const keysText = (keys) => keys ? keys.map((k) => KEY_NAMES[k] || k).join(' + ') : NO_SHORTCUT;

  const symbol = (ch) => SYMBOLS.find((s) => s.sym === ch);

  // Private preview: features that aren't public yet (the info strip and docs.html).
  // Visit any page with ?preview=1 to turn them on in this browser, ?preview=0 to turn them off.
  // This only hides them from the page; the code and text are still public in the source.
  const PREVIEW = (() => {
    try {
      const q = new URLSearchParams(location.search).get('preview');
      if (q !== null) localStorage.setItem('dyscsheet.preview', q === '1' ? '1' : '');
      return localStorage.getItem('dyscsheet.preview') === '1';
    } catch (_) { return false; }
  })();
  if (PREVIEW) document.documentElement.classList.add('preview');

  return { KINDS, SYMBOLS, BUTTONS, MORE_KEYS, SHOW, esc, show, keysText, symbol, NO_SHORTCUT, PREVIEW };
})();
