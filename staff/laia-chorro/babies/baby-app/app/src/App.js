import React, { Component } from 'react'
import './App.css'
import logic from './logic'
import Login from './components/pages/Login'
import Home from './components/pages/Home'
import Register from './components/pages/Register'
//import Update from './components/pages/Update'
import Nav from './components/sections/Nav'
import Myzone from './components/Myzone'
import ProductDetail from './components/pages/ProductDetail'
import PublicUser from './components/pages/PublicUser'


import Alert from 'react-s-alert';
 
import 'react-s-alert/dist/s-alert-default.css';
import 'react-s-alert/dist/s-alert-css-effects/slide.css';

import { Route, withRouter, Redirect } from 'react-router-dom'


class App extends Component {

	state = {
		loggedIn: logic.loggedIn,
		errorMsg: null,
		showFeedback: false,
		idFavs: [],
		profilePhoto: null,
		detailProduct: null
	}

	hideFeedback = () => this.setState({errorMsg: null, showFeedback: false})

	componentDidMount() {
        this.getProfilePhoto()
    }

	onRegister = (email, password) => {
		this.hideFeedback()
		logic.register(email, password)
		.then(() => {
			this.setState({showFeedback: true})
			this.props.history.push('/register')
		})
		.catch(({message}) => this.setState({errorMsg: message}))
	}

	onLogin = (email, password) => {
		this.hideFeedback()
		logic.login(email, password)
			.then(() => {
				//this.setState({loggedIn: true, showFeedback: true})
				this.setState({loggedIn: true})
				this.getProfilePhoto()
				this.props.history.push('/mylist')
			})
			.catch(({message}) => {
				this.setState({errorMsg: message})
			})
	}

	onLogout = () => {
		logic.logout()

		this.setState({loggedIn: false, idFavs: []})
		this.props.history.push('/')
	}

	onProductUpload = (title, category, price, description, photo, longitude, latitude) => {

		logic.uploadProduct(title, category, price, description, photo, longitude, latitude)
			.then(() => logic.getPrivateUser() )
			.then(() => this.props.history.push('/mylist'))
			.catch(({ message }) => this.setState({ error: message }))
			/*.then(() => this.setState({ succeeded: true }))
			.catch(({ message }) => this.setState({ error: message }))*/
	}

	getIdFavs = () => {
        const favs = logic.getUserField('favs')

        if (logic.loggedIn && favs && favs.length) {
			const idFavs = favs.map(fav => fav.id)
            this.setState({ idFavs })
        }
    }

	onAddFavourite = (idProduct) => {
		if (!this.state.loggedIn) return this.props.history.push('/login')

		return Promise.resolve()
			.then(() => logic.addProductToFavourites(idProduct))
			.then(() => logic.getPrivateUser() )
			.then(() => this.getIdFavs() )
			.catch(res => {
			})
			//.catch(({ message }) => this.setState({ errorMsg: message }))
	}

	onRemoveFavourite = idProduct => {
		return Promise.resolve()
			.then(() => logic.removeProductFromFavourites(idProduct))
			.then(() => logic.getPrivateUser() )
			.then(() => this.getIdFavs() )
			.catch(res => {
			})
			//.catch(({ message }) => this.setState({ errorMsg: message }))
	}

	getProfilePhoto = () => {
        const profilePhoto = logic.getUserField('photo')

        if (logic.loggedIn && profilePhoto)
			this.setState({ profilePhoto })
    }

	onUploadProfilePhoto = photo => {
		return Promise.resolve()
			.then(() => logic.uploadProfilePhoto(photo))
			.then(() => logic.getPrivateUser() )
			.then(() => this.getProfilePhoto() )
			.catch(res => {
			})
	}

	onProductDetail = productId => {
		return Promise.resolve()
			.then(() => logic.incrementProductViewsById(productId))
            .then(() => logic.getProductDetailById(productId))
			.then(product => this.setState({ product }) )
			.then(() => this.props.history.push(`/item/${productId}`))
            //.catch(({ message }) => this.setState({ errorMsg: message }))
	}

  /*onUpdate = (password, newUsername, newPassword) => {
    this.hideFeedback()
    logic.updateUser(password, newUsername, newPassword)
    .then(() => {
      this.setState({showFeedback: true})
      this.props.history.push('/update')
    })
    .catch(({message}) => this.setState({errorMsg: message}))
  }*/


	render() {
		const { loggedIn, errorMsg, showFeedback, idFavs, profilePhoto, product } =  this.state
		const { onRegister, onLogin, onLogout, onProductUpload, hideFeedback, 
				getIdFavs, onAddFavourite, onRemoveFavourite, onUploadProfilePhoto,
				onProductDetail } = this

		return (
			<div className="baby-app-container">
				<Nav loggedIn={loggedIn} profilePhoto={profilePhoto}/>

				<Route path="/" exact render={() => <Home onAddFavourite={onAddFavourite} onRemoveFavourite={onRemoveFavourite} idFavs={idFavs} getIdFavs={getIdFavs} onProductDetail={onProductDetail}/>} />
				<Route path="/login" exact render={() => <Login onLogin={onLogin} errorMsg={errorMsg} showFeedback={showFeedback} hideFeedback={hideFeedback}/>} />
				<Route path="/register" exact render={() => <Register onRegister={onRegister} errorMsg={errorMsg} showFeedback={showFeedback} hideFeedback={hideFeedback}/>} />
				<Route path="/(profile|mylist|favourites|reviews|prod/upload)" exact render={() => 
					loggedIn ? 
						<Myzone onLogout={onLogout} 
								onProductUpload={onProductUpload} 
								onRemoveFavourite={onRemoveFavourite} 
								idFavs={idFavs} 
								onUploadProfilePhoto={onUploadProfilePhoto}
								profilePhoto={profilePhoto}/> : 
						<Redirect to="/login" />
				} />
				<Route path="/item/:idProd" exact render={() => <ProductDetail onAddFavourite={onAddFavourite} onRemoveFavourite={onRemoveFavourite} idFavs={idFavs} getIdFavs={getIdFavs} onProductDetail={onProductDetail} product={product}/>} />
				<Route path="/user/:idUser" exact render={() => <PublicUser onAddFavourite={onAddFavourite} onRemoveFavourite={onRemoveFavourite} idFavs={idFavs} getIdFavs={getIdFavs}  />} />
				{/*<Route path="/update" exact render={() => loggedIn ? <Update onUpdateProp={onUpdate} email={logic.userUsername} errorMsg={errorMsg} showFeedback={showFeedback} hideFeedback={hideFeedback}/> : <Redirect to="/login" />} />*/}

				<Alert stack={{limit: 3}} />
			</div>
		)
	}
}

export default withRouter(App)
