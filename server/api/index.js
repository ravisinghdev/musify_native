module.exports = (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'Musify Dedicated Music Backend',
    endpoints: {
      search: '/api/search?query=husn',
      trending: '/api/trending',
      stream: '/api/stream?url=<ENCODED_STREAM_URL>'
    }
  });
};

