import Image from "next/image";
import LeftMenu from "@/components/LeftMenu";
import RightMenu from "@/components/RightMenu";

export default function ProfilePAge() {
  return (
    <div className="">
    <div className="">
        <LeftMenu type="profile" />
    </div>
    <div className="">
        <div className="">
            <div className="">
                <div className="">
                    <Image
                        src=""
                        alt=""
                        className="" />
                    <Image
                        src=""
                        alt=""
                        width={128}
                        height={128}
                        className="" />
                </div>
                <h1 className="">
                    Edward Gabriel May
                </h1>
                <div className="">
                    <div className="">
                        <span className="">123</span>
                        <span className="">Posts</span>
                    </div>
                    <div className="">
                        <span className="">1.2K</span>
                        <span className="">Followers</span>
                    </div>
                    <div className="">
                        <span className="">12.3K</span>
                        <span className="">Following</span>
                    </div>
                </div>
            </div>
            {/* <Feed /> */}
        </div>
    </div>
    <div className="">
        {/* <RightMenu /> */}
        <RightMenu userId="123" />
    </div>
</div>
  );
}
