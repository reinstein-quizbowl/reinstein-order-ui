This is a React app written in JavaScript. It originated with `create-react-app`.

It's the ordering interface for [Reinstein QuizBowl](https://www.reinsteinquizbowl.com). It uses the [corresponding back end](https://github.com/jonahgreenthal/reinstein-order-backend).

The production instance is running at [`https://order.reinsteinquizbowl.com`](https://order.reinsteinquizbowl.com).

# Running
Check `.env` or `.env.production` as appropriate to make sure you're connecting to the correct back end.

Run `yarn start` for development. It runs at `http://localhost:3000` and hot-reloads (though not particularly well).

Run `yarn build` for production. The production instance is expected to run under Apache using `public/.htaccess`.

Run `yarn eslint src` to run the linter.

# Design
It's supposed to match `https://www.reinsteinquizbowl.com`. The appearance, and especially the implementation thereof, could use some polish.

# Security
The app uses JWTs signed by the back end.

For now, there is only one role (`admin`). Every user gets it. We don't currently anticipate a need for distinguishing roles, but that can easily be added later if necessary.

The auth setup was largely accomplished by following [this tutorial](https://www.bezkoder.com/spring-boot-react-jwt-auth/) (with some adaptations).

 
# License
The purpose of posting this code publicly is to serve as a portfolio item for its developer, [Jonah Greenthal](https://www.github.com/jonahgreenthal). The code is owned by Reinstein QuizBowl and is not licensed for other use, but you're welcome to look at it, and if you want to do something with it, write to [admin@reinsteinquizbowl.com](mailto:admin@reinsteinquizbowl.com).
