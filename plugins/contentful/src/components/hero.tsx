import Logo from "../assets/header_image.png"

export function Hero() {
    return (
        <img
            src={Logo}
            alt="Contentful Hero"
            className="object-cover w-full rounded-[10px] h-[200px] bg-contentful-blue"
        />
    )
}
