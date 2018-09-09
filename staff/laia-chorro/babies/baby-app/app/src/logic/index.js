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
    },

    _validateStateOptions(name, field) {
        validate._stringField(name, field)
        if (!['sold', 'reserved', 'pending', 'expired', 'removed'].includes(field)) 
            throw new Error(`${name} is not a valid state for a product`)
    },

    _validateProductFilters(filters) {
        validate._objectField('product filters', filters)

        const fieldNames = Object.keys(filters)

        fieldNames.forEach(fieldName => {
            if(fieldName === 'txt' || fieldName === 'cath') { // text, cathegory
                validate._stringField(fieldName, filters[fieldName])
            } else if(fieldName === 'date') { // publication date
                validate._dateField(fieldName, filters[fieldName] ? new Date(filters[fieldName]) : filters[fieldName])
            } else if(fieldName === 'dist' || fieldName === 'maxVal' || fieldName === 'minVal') { // distance, price
                const max = fieldName === 'dist'? 400 : 30000
                validate._intField(fieldName, filters[fieldName], 0, max)
            } else if(fieldName === 'long') { // loc: [long,lat]
                validate._longitude(filters[fieldName])
            } else if(fieldName === 'lat') { // loc: [long,lat]
                validate._latitude(filters[fieldName])
            } else {
                throw new Error(`is not possible to search for any product with the filter provided in ${fieldName}`)
            }
        })
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

    //LOGGIN//
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

                return this._call('authenticate', 'POST', {
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
                return this._call(`/me/${this._userId}`, 'GET', { 
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

    //USER//
    uploadProfilePhoto(photo) {
        return Promise.resolve()
        .then(() => {
            validate._objectField('photo', photo)

            const body = new FormData()
            body.append('image', photo)

            return this._call(`me/${this._userId}/photo`, 'PATCH', { 
                authorization: `bearer ${this._userToken}` 
            }, body, 200)
                .then(() => true)
        })
    },

    //PRODUCTS//
    getSimpleProductsByFilters(filters) {
        return Promise.resolve()
            .then(() => {
                if (filters) this._validateProductFilters(filters)

                const queryParams = this._buildQueryParams(filters)
                
                return this._call(`/prod/${queryParams}`, 'GET', { 
                    'Content-Type': 'application/json' 
                }, undefined, 200)
                    .then(res => res.json())
            })
    },

   uploadProduct(title, cathegory, price, description, photos, longitude, latitude) {

        return Promise.resolve()
            .then(() => {
                debugger;
                validate._stringField('title', title)
                validate._stringField('cathegory', cathegory)
                validate._floatField('price', price, 0, 999999)
                validate._stringField('description', description)
                if (photos) photos.forEach((photo, index) => {
                                validate._objectField(`photo${index}`, photo)
                            })
                
                validate._longitude(longitude)
                validate._latitude(latitude)
                //validate._location([longitude, latitude])
debugger;
                const body = new FormData()

                body.append('title', title)
                body.append('cathegory', cathegory)
                body.append('price', price)
                body.append('description', description)
                //body.append('image', photo)
                photos.forEach((photo, index) => {
                    body.append(`image${index}`, photo)
                })
                body.append('longitude', longitude)
                body.append('latitude', latitude)
        debugger;
                return this._call(`me/prod/${this._userId}`, 'POST', { 
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
            return this._call(`/me/${this._userId}/prod/${productId}/favs`, 'PATCH', { 
                'Authorization': `bearer ${this._userToken}`,
                'Content-Type': 'application/json'
            }, undefined, 200)
                .then(() => true)
        })
    },

    removeProductFromFavourites(productId) {
        return Promise.resolve()
        .then(() => {
            return this._call(`/me/${this._userId}/prod/${productId}/unfavs`, 'PATCH', { 
                'Authorization': `bearer ${this._userToken}`,
                'Content-Type': 'application/json'
            }, undefined, 200)
                .then(() => true)
        })
    }

}

module.exports = logic