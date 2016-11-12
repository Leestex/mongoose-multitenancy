# mongoose-multitenancy

This method is based on `mongo-tenant` library and 1 model manager per tenant in memory (actually each tenant dependent model has its clone for different tenants + 1 model manager for each tenant). Relies on `req.conn`. Supports only simple `tenantId` keys and doesn't allow to easily share information between tenants
