(async () => {
  const r = await fetch('https://itwield.com');
  const html = await r.text();
  const scriptMatch = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
  if (scriptMatch) {
     const jsUrl = 'https://itwield.com' + scriptMatch[1];
     const js = await (await fetch(jsUrl)).text();
     const match = js.match(/.{0,50}api\.itwield\.com.{0,100}/g);
     console.log('Match api.itwield.com:', match);
  }
})();
