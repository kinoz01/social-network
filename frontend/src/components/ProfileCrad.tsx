import Image from "next/image"

const ProfileCard = () => {
    return (
        <div className="">
            <div className="">
                <Image
                    src=""
                    alt=""
                    
                    className="" />
                <Image
                    src=""
                    alt=""
                    width={48}
                    height={48}
                    className="" />
            </div>
            <div className="">
                <span className="">
                    Edward Gabriel May
                </span>
                <div className="">
                    <Image
                        src=""
                        alt=""
                        width={12}
                        height={12}
                        className="" />
                    <Image
                        src=""
                        alt=""
                        width={12}
                        height={12}
                        className="" />
                    <Image
                        src=""
                        alt=""
                        width={12}
                        height={12}
                        className="" />
                    <span className="">500 Followers</span>
                </div>
                <button className="">My Profile</button>
            </div>
        </div>
    )
}

export default ProfileCard