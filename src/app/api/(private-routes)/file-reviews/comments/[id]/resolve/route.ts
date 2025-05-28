 


//import { auth } from "@/app/api/[...nextauth]/route";
import { handleError } from "@/app/api/lib/errors";
import { reviewService } from "@/app/api/services/fileReviewServices";
import { userFromSession } from "@/lib/auth";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";
//import { auth } from "@auth/route";

// export const PUT = auth(async (request: NextAuthRequest, context) => {
//   const { params } = context;
//   const { id: reviewId } = params as unknown as { id: string };

//   try {
//     const sessionUser = await userFromSession(request);
//     const { status } = await request.json();

//     if (!status) {
//       return NextResponse.json(
//         { error: "Status is required" },
//         { status: 400 }
//       );
//     }

//     const updatedReview = await reviewService.updateReviewStatus(
//       reviewId,
//       sessionUser.id,
//       status
//     );
//     if (!updatedReview) {
//       return NextResponse.json(
//         { error: "Failed to update review" },
//         { status: 500 }
//       );
//     }

//     console.log("Updated review:", updatedReview);
    
//     return NextResponse.json(updatedReview);
//   } catch (error) {
//     return handleError(error);
//   }
// });
 
 
// export const POST = auth(async (request: NextAuthRequest, context) => {
//   try {

//      // First await a microtask to ensure async context
//     await Promise.resolve();
    
     
//     const params = await context.params;
//     const reviewId = params?.id; // Access params from context
   
//     if (!reviewId) {
//       return NextResponse.json(
//         { error: "Review ID is required" },
//         { status: 400 }
//       );
//     }
//     const sessionUser = await userFromSession(request);
//     if (!sessionUser?.id) {
//       return NextResponse.json(
//         { error: "Authentication required" },
//         { status: 401 }
//       );
//     }

//     const { content } = await request.json();
//     if (!content) {
//       return NextResponse.json(
//         { error: "Comment content is required" },
//         { status: 400 }
//       );
//     }

//     const newComment = await reviewService.addComment({
//       reviewId,
//       userId: sessionUser.id,
//       content
//     });

//     return NextResponse.json({
//       id: newComment.id,
//       content: newComment.content,
//       createdAt: newComment.createdAt,
//       user: {
//         id: sessionUser.id,
//         name: sessionUser.name
//       }
//     }, { status: 201 });

//   } catch (error) {
//     console.error("Comment creation error:", error);
//     return handleError(error);
//   }
// });