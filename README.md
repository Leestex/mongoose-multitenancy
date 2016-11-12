# mongoose-multitenancy

The idea behind this solution is to completely rely on one mechanism - ACL. So, we have rules for each role and based on this rules we can perform 2 important operations:
* get all records from db accessible by specific ability: `Task.accessibleBy(req.ability)`
* check whether we can perform an action on `Task`: `req.ability.can('delete', task)`

The first can be checked this way:
* GET /?user=admin|user|franchise ; `admin` and `user` are system tenants and `franchise` is another tenant which has access to tasks of `admin` and `user` tenants
* GET /?user=admin|user|franchise&deleteId=$taskId ; allows to check whether it's possible to delete task. Task can't be deleted if it's not accessible (e.g., in another tenant) or its `private` property is `true`

Some work needs to be finished around testing and fixing `rulesToQuery` function in mongoose middleware. But looks like it's the best way to go which solves 2 problems: tenants separation + access management

Inspired by https://github.com/CanCanCommunity/cancancan/wiki
