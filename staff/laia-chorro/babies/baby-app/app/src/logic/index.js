const validate = require('./validate')

const logic = {
    url: 'http://localhost:8080/api',

    _call(path, method, headers, body, expectedStatus) {
        const config = { method }

        if (headers) config.headers = headers
        if (body) config.body = body

        return fetch(`${this.url}/${path}`, config)
            .then(res => {
                if (res.status === expectedStatus) {
                    return res
                } else
                    return res.json()
                        .then(({ message }) => {
                            throw new Error(message)
                        })
            })
    },

    set _userId(userId) {
        sessionStorage.setItem('userId', userId)
    },

    get _userId() {
        return sessionStorage.getItem('userId')
    },

    set _userToken(userToken) {
        sessionStorage.setItem('userToken', userToken)
    },

    get _userToken() {
        return sessionStorage.getItem('userToken')
    },

    set _user(user) {
        sessionStorage.setItem('user', JSON.stringify(user))
    },

    get _user() {
        return JSON.parse(sessionStorage.getItem('user'))
        //var obj = JSON.parse(sessionStorage.user);
    },

    _validateStateOptions(name, field) {
        validate._stringField(name, field)
        if (!['sold', 'reserved', 'pending', 'expired', 'removed'].includes(field)) 
            throw new Error(`${name} is not a valid state for a product`)
    },

    _buildQueryParams(filters) {
        const url = new URL(this.url)

        if (filters) {
            const fieldNames = Object.keys(filters)
            fieldNames.forEach(fieldName => url.searchParams.append(fieldName, filters[fieldName]))
        }

        return url.search
    },

    getUserField(nameField) {
        if (this._user && this._user[nameField]) return this._user[nameField]

        return null
    },

    get loggedIn() {
        return this._userId && this._userToken
    },

    register(email, password) {
        return Promise.resolve()
            .then(() => {
                validate._email(email)
                validate._stringField('password', password)

                return this._call('register', 'post', {
                    'Content-Type': 'application/json'
                }, JSON.stringify({ email, password }), 201)
                    .then(() => true)
            })
    },

    authenticate(email, password) {
        return Promise.resolve()
            .then(() => {
                validate._email(email)
                validate._stringField('password', password)

                return this._call('authenticate', 'post', {
                    'Content-Type': 'application/json'
                }, JSON.stringify({ email, password }), 200)
                    .then(res => res.json())
                    .then(({ user, token }) => {
                        this._userId = user
                        this._userToken = token
        
                        return true
                    })
            })
    },

    getPrivateUser() {
        return Promise.resolve()
            .then(() => {
                return this._call(`/me/${this._userId}`, 'get', { 
                    'Authorization': `bearer ${this._userToken}`,
                    'Content-Type': 'application/json' 
                }, undefined, 200)
                    .then(res => res.json() )
                    .then(res => this._user = res )
            })
    },

    login(email, password) {
        return Promise.resolve()
            .then(() => this.authenticate(email, password))
            .then(() => this.getPrivateUser() )
    },

    logout() {
        this._userId = null
        this._userToken = null
        this._user = null

        sessionStorage.clear()
    },

    getSimpleProductsByFilters(filters) {
        return Promise.resolve()
            .then(() => {
                //this._validateFilters('filters', filters)

                const queryParams = this._buildQueryParams(filters)

                return this._call(`/prod/${queryParams}`, 'get', { 
                    'Content-Type': 'application/json' 
                }, undefined, 200)
                    .then(res => res.json())
            })
    },

   uploadProduct(title, cathegory, price, description, photo, longitude, latitude) {

        return Promise.resolve()
            .then(() => {
                validate._stringField('title', title)
                validate._stringField('cathegory', cathegory)
                validate._floatField('price', price, 0, 999999)
                validate._stringField('description', description)
                validate._objectField('photo', photo)
                validate._longitude(longitude)
                validate._latitude(latitude)
                //validate._location([longitude, latitude])

                const body = new FormData()

                body.append('title', title)
                body.append('cathegory', cathegory)
                body.append('price', price)
                body.append('description', description)
                body.append('image', photo)
                body.append('longitude', longitude)
                body.append('latitude', latitude)
                
                return this._call(`me/prod/${this._userId}`, 'post', { 
                    authorization: `bearer ${this._userToken}` 
                }, body, 201)
                    .then(() => true)
            })
    },

    updateStateProd(productId, state) {
        return Promise.resolve()
        .then(() => {
            this._validateStateOptions('state', state)

            const body = { state }

            return this._call(`/me/${this._userId}/prod/${productId}/state`, 'PATCH', { 
                'Authorization': `bearer ${this._userToken}`,
                'Content-Type': 'application/json'
            }, JSON.stringify(body), 200)
                .then(() => true)
        })
    },

    addProductToFavourites(productId) {
        return Promise.resolve()
        .then(() => {
            debugger;
            return this._call(`/me/${this._userId}/prod/${productId}/favs`, 'PATCH', { 
                'Authorization': `bearer ${this._userToken}`,
                'Content-Type': 'application/json'
            }, undefined, 200)
                .then(() => true)
        })

    }

    /*userRouter.patch('/me/:user/prod/:prod/favs', [validateJwt, jsonBodyParser], (req, res) => {
        const { params: { user, prod } } = req*/

}

module.exports = logic