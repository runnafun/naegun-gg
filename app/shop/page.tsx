'use client';
import {useState} from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ShopHero from '../components/shop/ShopHero';
import ShopLive from '../components/shop/ShopLive';
import './shop.css';
export default function ShopPage(){
 const [query,setQuery]=useState('');
 return <main className="shop-page"><Header active="shop"/><ShopHero query={query} onChange={setQuery}/><section className="shop-content"><div className="shop-content-inner"><ShopLive query={query}/></div></section><Footer/></main>;
}
