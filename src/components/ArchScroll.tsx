// 'use client'

// import { useGSAP } from '@gsap/react'
// import gsap from 'gsap'
// import { ScrollTrigger } from 'gsap/ScrollTrigger'
// import { useRef, useState } from 'react'
// import Lenis from '@studio-freight/lenis'

// gsap.registerPlugin(ScrollTrigger)

// const slides = [
//   {
//     title: 'Green Cityscape',
//     desc: 'Vibrant streets with vertical gardens and solar buildings.',
//     img: 'https://ik.imagekit.io/kg2nszxjp/GSAP%20pinned%20image%20mask%20reveal%20on%20scroll/cu8978xjlsjjpjk52ta0.webp',
//   },
//   {
//     title: 'Blue Urban Oasis',
//     desc: 'Avenues with azure facades and eco-structures.',
//     img: 'https://ik.imagekit.io/kg2nszxjp/GSAP%20pinned%20image%20mask%20reveal%20on%20scroll/trh7c8ufv1dqfrofdytd.webp',
//   },
//   {
//     title: 'Fluid Architecture',
//     desc: 'Desert refuge with fluid architecture.',
//     img: 'https://ik.imagekit.io/kg2nszxjp/GSAP%20pinned%20image%20mask%20reveal%20on%20scroll/aw6qwur0pggp5r03whjq.webp',
//   },
//   {
//     title: 'Martian Arches',
//     desc: 'Ethereal structures over alien landscapes.',
//     img: 'https://ik.imagekit.io/kg2nszxjp/GSAP%20pinned%20image%20mask%20reveal%20on%20scroll/sqwn8u84zd1besgl0zpd.webp',
//   },
// ]

// export default function ArchScroll() {
//  const sectionRef = useRef<HTMLElement>(null)
//  const imgRef = useRef<HTMLDivElement>(null)
//  const progressRef = useRef<HTMLDivElement>(null)

//  const [activeIndex, setActiveIndex] = useState(0)

//  useGSAP(() => {
//    const section = sectionRef.current

//    // ✅ INIT LENIS (ONLY ONCE)
//    const lenis = new Lenis({
//      duration: 1.2,
//      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
//      smooth: true,
//      gestureDirection: 'vertical',
//      smoothTouch: true,
//      touchMultiplier: 2,
//    })

//    let rafId: number

//    function raf(time: number) {
//      lenis.raf(time)
//      ScrollTrigger.update()
//      rafId = requestAnimationFrame(raf)
//    }

//    rafId = requestAnimationFrame(raf)

//    // ✅ SAFE SELECTORS
//    const wrappers = gsap.utils.toArray<HTMLElement>('.arch__right .img-wrapper')
//    const leftItems = gsap.utils.toArray<HTMLElement>('.arch__left .arch__info')
//    const imgs = gsap.utils.toArray<HTMLImageElement>('.img-wrapper img')

//    // ✅ z-index
//    wrappers.forEach((el) => {
//      const order = el.getAttribute('data-index')
//      if (order) el.style.zIndex = order
//    })

//    // ✅ MOBILE ORDER HANDLER
//    function handleMobileLayout() {
//      const isMobile = window.matchMedia('(max-width: 768px)').matches

//      if (isMobile) {
//        leftItems.forEach((item, i) => {
//          item.style.order = String(i * 2)
//        })
//        wrappers.forEach((item, i) => {
//          item.style.order = String(i * 2 + 1)
//        })
//      } else {
//        leftItems.forEach((item) => (item.style.order = ''))
//        wrappers.forEach((item) => (item.style.order = ''))
//      }
//    }

//    handleMobileLayout()

//    // ✅ RESIZE (with cleanup)
//    let resizeTimeout: any

//    const onResize = () => {
//      clearTimeout(resizeTimeout)
//      resizeTimeout = setTimeout(handleMobileLayout, 100)
//    }

//    window.addEventListener('resize', onResize)

//    const bgColors = ['#EDF9FF', '#FFECF2', '#FFE8DB']
//    // 🎯 TRACK ACTIVE arch__info
//    leftItems.forEach((item, index) => {
//      ScrollTrigger.create({
//        trigger: item,
//        start: 'top+=50% center',
//        end: 'bottom-=50% center',
//        onEnter: () => setActiveIndex(index),
//        onEnterBack: () => setActiveIndex(index),
//      })
//    })
//    // ✅ SAME GSAP LOGIC
//    ScrollTrigger.matchMedia({
//      '(min-width: 769px)': function () {
//        const mainTimeline = gsap.timeline({
//          scrollTrigger: {
//            trigger: '.arch',
//            start: 'top top',
//            end: 'bottom bottom',
//            pin: '.arch__right',
//            scrub: true,
//          },
//        })

//        gsap.set(imgs, {
//          clipPath: 'inset(0)',
//          objectPosition: '0px 0%',
//        })

//        imgs.forEach((_, index) => {
//          const currentImage = imgs[index]
//          const nextImage = imgs[index + 1] || null

//          const sectionTimeline = gsap.timeline()

//          if (nextImage) {
//            sectionTimeline
//              .to(
//                'body',
//                {
//                  backgroundColor: bgColors[index],
//                  duration: 1.5,
//                  ease: 'power2.inOut',
//                },
//                0
//              )
//              .to(
//                currentImage,
//                {
//                  clipPath: 'inset(0px 0px 100%)',
//                  objectPosition: '0px 20%',
//                  duration: 1.5,
//                  ease: 'none',
//                },
//                0
//              )
//              .to(
//                nextImage,
//                {
//                  objectPosition: '0px 80%',
//                  duration: 1.5,
//                  ease: 'none',
//                },
//                0
//              )
//          }
//             sectionTimeline.to(
//             progressRef.current,
//             {
//                 scaleY: (index + 1) / (imgs.length - 1),
//                 duration: 1.5,
//                 ease: 'none',
//             },
//             0
//             )
//          mainTimeline.add(sectionTimeline)
//        })
//      },

//      '(max-width: 768px)': function () {
//        const mbTimeline = gsap.timeline()

//        gsap.set(imgs, {
//          objectPosition: '0px 60%',
//        })

//        imgs.forEach((image, index) => {
//          const innerTimeline = gsap.timeline({
//            scrollTrigger: {
//              trigger: image,
//              start: 'top-=70% top+=50%',
//              end: 'bottom+=200% bottom',
//              scrub: true,
//            },
//          })

//          innerTimeline
//            .to(image, {
//              objectPosition: '0px 30%',
//              duration: 5,
//              ease: 'none',
//            })
//            .to('body', {
//              backgroundColor: bgColors[index],
//              duration: 1.5,
//              ease: 'power2.inOut',
//            })

//          mbTimeline.add(innerTimeline)
//        })
//      },
//    })

//    // ✅ CLEANUP (VERY IMPORTANT)
//    return () => {
//      window.removeEventListener('resize', onResize)
//      cancelAnimationFrame(rafId)
//      lenis.destroy()
//    }
//  }, [])
//   return (
//     <div className="wrapper relative min-h-screen w-full">
//       <div className="spacer"></div>

//       <div className="arch">
        
//         <div className="arch__left">
//           <div className="arch__info" id="green-arch">
//             <div className="content">
//               <h2 className="header">Green Cityscape</h2>
//               <p className="desc">
//                 Vibrant streets with vertical gardens and solar buildings. This oasis thrives on renewable energy, smart
//                 transport, and green spaces for biodiversity.
//               </p>
//               <a className="link" href="#" style={{ backgroundColor: '#D5FF37' }}>
//                 <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none">
//                   <path
//                     fill="#121212"
//                     d="M5 2c0 1.105-1.895 2-3 2a2 2 0 1 1 0-4c1.105 0 3 .895 3 2ZM11 3.5c0 1.105-.895 3-2 3s-2-1.895-2-3a2 2 0 1 1 4 0ZM6 9a2 2 0 1 1-4 0c0-1.105.895-3 2-3s2 1.895 2 3Z"
//                   />
//                 </svg>{' '}
//                 <span>Learn More</span>
//               </a>
//             </div>
//           </div>

//           <div className="arch__info" id="blue-arch">
//             <div className="content">
//               <h2 className="header">Blue Urban Oasis</h2>
//               <p className="desc">
//                 Avenues with azure facades and eco-structures. This hub uses clean energy, smart transit, and parks for
//                 urban wildlife.
//               </p>
//               <a className="link" href="#" style={{ backgroundColor: '#7DD6FF' }}>
//                 <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none">
//                   <path
//                     fill="#121212"
//                     d="M5 2c0 1.105-1.895 2-3 2a2 2 0 1 1 0-4c1.105 0 3 .895 3 2ZM11 3.5c0 1.105-.895 3-2 3s-2-1.895-2-3a2 2 0 1 1 4 0ZM6 9a2 2 0 1 1-4 0c0-1.105.895-3 2-3s2 1.895 2 3Z"
//                   />
//                 </svg>{' '}
//                 <span>Learn More</span>
//               </a>
//             </div>
//           </div>

//           <div className="arch__info" id="pink-arch">
//             <div className="content">
//               <h2 className="header">Fluid Architecture</h2>
//               <p className="desc">
//                 Desert refuge with fluid architecture and glowing interiors. This sanctuary harnesses solar power,
//                 sustainable design, and natural harmony for resilient living.
//               </p>
//               <a className="link" href="#" style={{ backgroundColor: '#FFA0B0' }}>
//                 <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none">
//                   <path
//                     fill="#121212"
//                     d="M5 2c0 1.105-1.895 2-3 2a2 2 0 1 1 0-4c1.105 0 3 .895 3 2ZM11 3.5c0 1.105-.895 3-2 3s-2-1.895-2-3a2 2 0 1 1 4 0ZM6 9a2 2 0 1 1-4 0c0-1.105.895-3 2-3s2 1.895 2 3Z"
//                   />
//                 </svg>{' '}
//                 <span>Learn More</span>
//               </a>
//             </div>
//           </div>

//           <div className="arch__info" id="orange-arch">
//             <div className="content">
//               <h2 className="header">Martian Arches</h2>
//               <p className="desc">
//                 Ethereal structures arc over tranquil waters, bathed in the glow of a setting Martian sun. This desolate
//                 beauty showcases the stark, captivating landscape of the red planet.
//               </p>
//               <a className="link" href="#" style={{ backgroundColor: '#FFA17B' }}>
//                 <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none">
//                   <path
//                     fill="#121212"
//                     d="M5 2c0 1.105-1.895 2-3 2a2 2 0 1 1 0-4c1.105 0 3 .895 3 2ZM11 3.5c0 1.105-.895 3-2 3s-2-1.895-2-3a2 2 0 1 1 4 0ZM6 9a2 2 0 1 1-4 0c0-1.105.895-3 2-3s2 1.895 2 3Z"
//                   />
//                 </svg>{' '}
//                 <span>Learn More</span>
//               </a>
//             </div>
//           </div>
//         </div>

//         <div className="arch__right">
//           <div className="img-wrapper" data-index="4">
//             <img
//               src="https://ik.imagekit.io/kg2nszxjp/GSAP%20pinned%20image%20mask%20reveal%20on%20scroll/cu8978xjlsjjpjk52ta0.webp"
//               alt="Green Architecture"
//             />
//           </div>

//           <div className="img-wrapper" data-index="3">
//             <img
//               src="https://ik.imagekit.io/kg2nszxjp/GSAP%20pinned%20image%20mask%20reveal%20on%20scroll/trh7c8ufv1dqfrofdytd.webp"
//               alt="Blue Architecture"
//             />
//           </div>

//           <div className="img-wrapper" data-index="2">
//             <img
//               src="https://ik.imagekit.io/kg2nszxjp/GSAP%20pinned%20image%20mask%20reveal%20on%20scroll/aw6qwur0pggp5r03whjq.webp"
//               alt="Pink Architecture"
//             />
//           </div>

//           <div className="img-wrapper" data-index="1">
//             <img
//               src="https://ik.imagekit.io/kg2nszxjp/GSAP%20pinned%20image%20mask%20reveal%20on%20scroll/sqwn8u84zd1besgl0zpd.webp"
//               alt="Orange Architecture"
//             />
//           </div>
//         </div>
//       </div>

//       <div className="spacer"></div>
//     </div>
//   )
// }
