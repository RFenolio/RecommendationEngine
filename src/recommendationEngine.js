function u (list1, list2) {
  // return list of items present in both lists
  var itemMap = list1.reduce(function(map, item) { 
    map[item] = 1; 
    return map; 
  }, 
  { });
  var inBoth = list2.filter(function(item) { 
    return itemMap[item]; 
  });
  return inBoth;
}

function n (list1, list2) {
  // return list of items present in only of of the two lists

  var itemMap = list1.reduce(function(map, item) { 
    map[item] = { isInOne: true, value: item }; 
    return map;
  }, 
  { });

  itemMap = list2.reduce(function(map, item) { 
    if (!map[item]) {
      map[item] = { isInTwo: true, value: item };  
    } else {
      map[item].isInTwo = true;
    }
    return map;
  }, itemMap);


  var inOne = [];
  for(var key in itemMap) {
    if ( ! (itemMap[key].isInOne && itemMap[key].isInTwo)) {
      inOne.push(itemMap[key].value);
    }
  }
  return inOne;
}

function jaccardIndex (list1, list2) {
  // return decimal (0.0 to 1.0) which is the union over the total items

  var totalItems = list1.length + list2.length;
  if (totalItems) {
    var union = u(list1, list2).length;
    if (union == 0) {
      return 0; 
    } else if (union == list1.length && union == list2.length) {
      return 1;
    } else {
      return n(list1, list2).length / u(list1, list2).length;
    }
  }
  return 0;
}

function calculateAgreement (user1, user2) {
  // return decimal (0.0 to 1.0) which is the agreement (likes AND dislikes) over the total
  var totalItems = u(user1.likes, user2.likes).length + n(user1.likes, user2.likes).length + 
      u(user1.dislikes, user2.dislikes).length + n(user1.dislikes, user2.dislikes).length;

  var agreeingLikes = u(user1.likes, user2.likes).length;
  var agreeingDislikes = u(user1.dislikes, user2.dislikes).length;

  if (totalItems !== 0) {
    return (agreeingLikes + agreeingDislikes) / totalItems;
  } else {
    return 0;
  }
}

function getUniques() {
  var map = Array.prototype.reduce.call(arguments, function(map, list) { 
    return list.reduce(function(map, item) { 
      map[item] = 1;
      return map;
    }, map);
  }, {});
  return Object.keys(map);
}

function calculateDisagreement (user1, user2) {
  // return decimal (0.0 to 1.0) which is the disagreement over the total
  var totalItems = getUniques(user1.likes, user1.dislikes, user2.likes, user2.dislikes).length;
  var agreeingLikes = u(user1.likes, user2.dislikes).length;
  var agreeingDislikes = u(user1.dislikes, user2.likes).length;


  if (totalItems !== 0) {
    return (agreeingLikes + agreeingDislikes) / totalItems;
  } else {
    return 0;
  }
}

function calculateSimilarity (user1, user2) {
  // return decimal (-1.0 to 1.0) which is the agrement minus the disagreement

  // over the total (?)

  var agreement = calculateAgreement(user1, user2);
  var disagreement = calculateDisagreement(user1, user2);
  return (agreement - disagreement);
}

function predictLike (itemId, user, users) {
  // return decimal (-1.0 to 1.0) which is the probability the user will like the item
  var prediction = 0;
  var nrOfUsers = users.length;

  for (var key in users) {
    var otherUser = users[key];
    if (otherUser.id == user.id) {
      nrOfUsers--;
      continue;
    }

    var similarity =  calculateSimilarity(user, otherUser);

    if (otherUser.likes.includes(itemId)) {
      prediction += similarity;
    } else if(otherUser.dislikes.includes(itemId)) {
      prediction -= similarity;
    }
  }


  if (nrOfUsers === 0) {
    return NaN;
  }

  return prediction / nrOfUsers;
}

function recommendationsFor(user, users) {
  // return list of item ids ordered by probability the user will like the item (greatest first)
  var rated = user.likes.concat(user.dislikes);
  var allMovies = users.reduce(function (all, otherUser) {
    return getUniques(all, otherUser.likes, otherUser.dislikes)
  }, []);
  var unrated = n(rated, allMovies);

  var predictions = unrated.map(function(movie) {
    movie = parseInt(movie);
    return {
      movie: movie,
      prediction: predictLike(movie, user, users)
    };
  });
  var sorted = predictions.sort(function(a, b) {
    return b.prediction - a.prediction;
  });

  console.log(unrated, sorted);

  return sorted.map(function(item) {
    return (item.movie);
  });
}

// You're welcome to use this but you don't have to: [1,2,3].contains(2) -> true
Object.defineProperty(Array.prototype, 'includes', {
  value: function (primitive) {
    return this.indexOf(primitive) !== -1 // <- Nobody wants to read that!
  },
  enumerable: false // Looking at object's keys will NOT include this property.
});
