export const validateWebsiteId = (req, res, next) => {
  const { websiteId } = req.params;
  
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(websiteId)) {
    return res.status(400).json({ 
      error: 'Invalid website ID format',
      details: 'Must be a valid UUID version 4'
    });
  }
  
  next();
};