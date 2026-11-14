// Serverless function: fetches trending Hindi and global hits
const crypto = require('crypto');
const DES_KEY = Buffer.from('38346591', 'utf8');

function decryptMediaUrl(encryptedUrl) {
  if (!encryptedUrl) return null;
  try {
    const decipher = crypto.createDecipheriv('des-ecb', DES_KEY, null);
    decipher.setAutoPadding(true);
    let decrypted = decipher.update(encryptedUrl, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted.trim();
  } catch (e) {
    return null;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const targetUrl = `https://www.jiosaavn.com/api.php?__call=search.getResults&q=Hindi%20Trending%20Top%20Hits&_format=json&_marker=0&api_version=4&ctx=web6dot0&n=30&p=1`;
    const response = await fetch(targetUrl);
    const data = await response.json();
    const rawResults = data.results || [];

    const songs = rawResults.map((item) => {
      let directStream = '';
      if (item.encrypted_media_url) {
        directStream = decryptMediaUrl(item.encrypted_media_url);
      }
      if (!directStream && item.media_preview_url) {
        directStream = item.media_preview_url;
      }

      if (directStream) {
        directStream = directStream.replace('_96.mp4', '_320.mp4').replace('_160.mp4', '_320.mp4');
        if (directStream.startsWith('http://')) {
          directStream = directStream.replace('http://', 'https://');
        }
      }

      let image = item.image || '';
      if (image) {
        image = image.replace('150x150.jpg', '500x500.jpg');
        if (image.startsWith('http://')) {
          image = image.replace('http://', 'https://');
        }
      }

      return {
        id: item.id,
        title: item.title ? item.title.replace(/&quot;/g, '"').replace(/&#039;/g, "'") : 'Untitled',
        artist: item.more_info?.primary_artists || item.subtitle || 'Various Artists',
        album: item.more_info?.album || item.album || 'Single',
        artworkUrl: image,
        mediaUrl: directStream,
        duration: Number(item.more_info?.duration || item.duration) || 210,
        type: 'audio',
        year: item.year || ''
      };
    }).filter(s => !!s.mediaUrl);

    return res.status(200).json({ success: true, count: songs.length, results: songs });
  } catch (error) {
    console.error('Trending proxy error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

