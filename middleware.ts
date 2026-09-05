import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Route chỉ Admin ở tầng UI. LƯU Ý: đây chỉ là lớp bảo vệ UX,
    // mọi API tương ứng vẫn phải tự kiểm tra requireAdmin() (xem lib/permissions).
    const adminOnlyRoutes = ["/dashboard/users", "/dashboard/settings/admin"];
    const isAdminRoute = adminOnlyRoutes.some((r) => pathname.startsWith(r));

    if (isAdminRoute && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard?error=forbidden", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // phải có session hợp lệ
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/api/steel/:path*", "/api/users/:path*", "/api/history/:path*"],
};
