(function() {

    var BOX_URL = 'http://manila.dev.aidbox.io';

    function getIn(obj, path) {
        var t = obj;
        for (var i = 0; i < path.length; i++) {
            t = t[path[i]];
            if (!t) {
                return null;
            }
        }
        return t;
    }
    
     
    function mapPatient(entry) {
        return {
            id: entry.resource.id,
            given: getIn(entry, ['resource', 'name', 0, 'given', 0]),
            family: getIn(entry, ['resource', 'name', 0, 'family', 0]),
            gender: getIn(entry, ['resource', 'gender']),
            meta: entry.resource.meta
        };
    };

    function fillPatient(pt) {
        var res = {
            name: [{
                use: 'official',
                given: pt.given,
                family: pt.family
            }],
            gender: pt.gender,
            resourceType: 'Patient'
        };
        pt.meta && (res.meta = pt.meta);
        pt.id && (res.id = pt.id);
        return res;
    };

    var app = angular.module('app', ['ngCookies', 'ngAidbox']);
  
        app.controller('PatientMenuController', ['$rootScope', function($rootScope){
          this.menu = 1;
          
          this.isSet = function(checkItem) {
            return this.menu === checkItem;
          };
          
          this.setItem = function(activeItem) {
            this.menu = activeItem;
            switch(activeItem) {
              case 1:
                $rootScope.currentPage = 'patientProfile';  
                break;
              case 2:
                $rootScope.currentPage = 'patientDiagnoses';  
                break;
              case 3:
                $rootScope.currentPage = 'patientMedications';  
                break;
            };
          };
        }]);
        
        app.controller('PatientChartController', ['$http', '$aidbox', '$rootScope', function($http, $aidbox, $rootScope) {          
          
          this.readPatient = function(){
            var self = this;
            self.patient = {};
            $aidbox.http({
              url: '/fhir/Patient/' + $rootScope.currentPatientId,
              params: {}
            }).then(function(data){
              self.patient = data;
              // if you want to change self.patient, then create another property, e.g. self.patientView and use it, don't touch self.patient, so you could pass it back to FHIR server
              self.patientView = {};
              self.patientView.family = getIn(self.patient, ['name', 0, 'family', 0]);
              self.patientView.given = getIn(self.patient, ['name', 0, 'given', 0]);
              self.patientView.gender = self.patient.gender;
              self.patientView.id = self.patient.id;
              self.patientView.meta = self.patient.meta;
            });
          };
          
          this.readPatient();
          
          
          this.updatePatient = function() {
            var self = this;
            $aidbox.http({
                url: '/fhir/Patient/' + self.patient.id,
                method: 'PUT',
                data: fillPatient(self.patientView)
            }).then(function(data){
              self.readPatient();
            });
          };
          
          // define property and get value via function - 1st way to get data from FHIR resource
          this.patientGiven = function() {
            return getIn(this.patient, ['name', 0, 'given', 0]) || "not found";
          };     
          
          // envelope existing function 'getIn' to pass data - 2nd way to get data from FHIR resource
          this.getIn = function(path) {
            return getIn(this.patient, path);
          };
          
          this.patientFamily = function() {
            return getIn(this.patient, ['name', 0, 'family', 0]) || "not found";
          };     
          
          // patient.identifiers.*(@.system = 'orn:oid:........').value - we can use JSONpath to get data from FHIR resource         

        }]);

    app.run(function($rootScope, $aidbox) {
        var searchPatient = function() {
            var name = $rootScope.search.name;
            $aidbox.http({
                url: '/fhir/Patient/_search',
                params: {name: name, _sort: 'name'}
            }).then(function(data) {
                $rootScope.patients = data.entry.map(mapPatient);
            });
        };

        function handleError(data, response) {
            $rootScope.err = data;
        };

        $rootScope.newPatient = {};
        $rootScope.search = {};
        $rootScope.searchPatient = searchPatient;
        $rootScope.currentPage = 'patientList';  
        $rootScope.getIn = getIn;

        var loadGenders = function() {
            $aidbox.fhir.valueSet.expand('administrative-gender')
                .then(function(data) {
                    $rootScope.genders = data.map(function(coding){
                      return coding.code;
                    });
                }).catch(function(data) {
                    $rootScope.err = data;
                });
        };

        $aidbox.init({
            box: BOX_URL,
            onSignIn: function(user) {
                $rootScope.user = user;                         
                searchPatient();
                loadGenders()
            },
            onSignOut: function() {
                $rootScope.user = null;
            }
        });

        $rootScope.deletePatient = function(pt) {
            $aidbox.http({
                url: '/fhir/Patient/' + pt.id,
                method: 'DELETE'
            }).then(searchPatient, handleError)
        };

        $rootScope.auth = {
            signin: $aidbox.signin,
            signout: function() {
                $aidbox.signout();
                $rootScope.user = null;
            }
        };

        $rootScope.updatePatient = function(pt) {
            $aidbox.http({
                url: '/fhir/Patient/' + pt.id,
                method: 'PUT',
                data: fillPatient(pt)
            }).then(searchPatient, handleError);
        };
   
        $rootScope.openPatient = function(pt) {
            $rootScope.currentPatientId = pt.id;
            $rootScope.currentPage = 'patientProfile';
        };        
        
        $rootScope.backToPatientList = function() {            
            $rootScope.currentPage = 'patientList';
            searchPatient();
        };

        $rootScope.createPatient = function() {
            var pt = $rootScope.newPatient;
            $aidbox.http({
                url: '/fhir/Patient',
                method: 'POST',
                data: fillPatient(pt)
            }).then(function(data) {
                searchPatient();
                $rootScope.newPatient = {};
            }, handleError);
        };
        
        $rootScope.autofillPatient = function() {
          var femaleNames = ['Emily', 'Emma', 'Madison', 'Abigail', 'Olivia', 'Isabella', 'Hannah', 'Samantha', 'Ava', 'Ashley', 'Sophia', 'Elizabeth', 'Alexis', 'Grace', 'Sarah', 'Alyssa', 'Mia', 'Natalie', 'Chloe', 'Brianna', 'Lauren', 'Ella', 'Anna', 'Taylor', 'Kayla', 'Hailey', 'Jessica', 'Victoria', 'Jasmine', 'Sydney', 'Julia', 'Destiny', 'Morgan', 'Kaitlyn', 'Savannah', 'Katherine', 'Alexandra', 'Rachel', 'Lily', 'Megan', 'Kaylee', 'Jennifer', 'Angelina', 'Makayla', 'Allison', 'Brooke', 'Maria', 'Trinity', 'Lillian', 'Mackenzie', 'Faith', 'Sofia', 'Riley', 'Haley', 'Gabrielle', 'Nicole', 'Kylie', 'Katelyn', 'Zoe', 'Paige', 'Gabriella', 'Jenna', 'Kimberly', 'Stephanie', 'Alexa', 'Avery', 'Andrea', 'Leah', 'Madeline', 'Nevaeh', 'Evelyn', 'Maya', 'Mary', 'Michelle', 'Jada', 'Sara', 'Audrey', 'Brooklyn', 'Vanessa', 'Amanda', 'Ariana', 'Rebecca', 'Caroline', 'Amelia', 'Mariah', 'Jordan', 'Jocelyn', 'Arianna', 'Isabel', 'Marissa', 'Autumn', 'Melanie', 'Aaliyah', 'Gracie', 'Claire', 'Isabelle', 'Molly', 'Mya', 'Diana', 'Katie', 'Leslie', 'Amber', 'Danielle', 'Melissa', 'Sierra', 'Madelyn', 'Addison', 'Bailey', 'Catherine', 'Gianna', 'Amy', 'Erin', 'Jade', 'Angela', 'Gabriela', 'Jacqueline', 'Shelby', 'Kennedy', 'Lydia', 'Alondra', 'Adriana', 'Daniela', 'Natalia', 'Breanna', 'Kathryn', 'Briana', 'Ashlyn', 'Rylee', 'Eva', 'Kendall', 'Peyton', 'Ruby', 'Alexandria', 'Sophie', 'Charlotte', 'Reagan', 'Valeria', 'Christina', 'Summer', 'Kate', 'Mikayla', 'Naomi', 'Layla', 'Miranda', 'Laura', 'Ana', 'Angel', 'Alicia', 'Daisy', 'Ciara', 'Margaret', 'Aubrey', 'Zoey', 'Skylar', 'Genesis', 'Payton', 'Courtney', 'Kylee', 'Kiara', 'Alexia', 'Jillian', 'Lindsey', 'Mckenzie', 'Karen', 'Giselle', 'Mariana', 'Valerie', 'Sabrina', 'Alana', 'Serenity', 'Kelsey', 'Cheyenne', 'Juliana', 'Lucy', 'Kelly', 'Sadie', 'Bianca', 'Kyra', 'Nadia', 'Lilly', 'Caitlyn', 'Jasmin', 'Ellie', 'Hope', 'Cassandra', 'Jazmin', 'Crystal', 'Jordyn', 'Cassidy', 'Delaney', 'Liliana', 'Angelica', 'Caitlin', 'Kyla', 'Jayla', 'Adrianna', 'Tiffany', 'Abby', 'Carly', 'Chelsea', 'Camila', 'Erica', 'Makenzie', 'Karla', 'Cadence', 'Paris', 'Veronica', 'Mckenna', 'Brenda', 'Bella', 'Maggie', 'Karina', 'Esmeralda', 'Erika', 'Makenna', 'Julianna', 'Elena', 'Mallory', 'Jamie', 'Alejandra', 'Cynthia', 'Ariel', 'Vivian', 'Jayden', 'Amaya', 'Dakota', 'Elise', 'Haylee', 'Josephine', 'Aniyah', 'Bethany', 'Keira', 'Aliyah', 'Laila', 'Camryn', 'Fatima', 'Reese', 'Annabelle', 'Monica', 'Lindsay', 'Kira', 'Selena', 'Macy', 'Hanna', 'Heaven', 'Clara', 'Katrina', 'Jazmine', 'Jadyn', 'Stella'];
          var maleNames = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Charles', 'Joseph', 'Thomas', 'Christopher', 'Daniel', 'Paul', 'Mark', 'Donald', 'George', 'Kenneth', 'Steven', 'Edward', 'Brian', 'Ronald', 'Anthony', 'Kevin', 'Jason', 'Matthew', 'Gary', 'Timothy', 'Jose', 'Larry', 'Jeffrey', 'Frank', 'Scott', 'Eric', 'Stephen', 'Andrew', 'Raymond', 'Gregory', 'Joshua', 'Jerry', 'Dennis', 'Walter', 'Patrick', 'Peter', 'Harold', 'Douglas', 'Henry', 'Carl', 'Arthur', 'Ryan', 'Roger', 'Joe', 'Juan', 'Jack', 'Albert', 'Jonathan', 'Justin', 'Terry', 'Gerald', 'Keith', 'Samuel', 'Willie', 'Ralph', 'Lawrence', 'Nicholas', 'Roy', 'Benjamin', 'Bruce', 'Brandon', 'Adam', 'Harry', 'Fred', 'Wayne', 'Billy', 'Steve', 'Louis', 'Jeremy', 'Aaron', 'Randy', 'Howard', 'Eugene', 'Carlos', 'Russell', 'Bobby', 'Victor', 'Martin', 'Ernest', 'Phillip', 'Todd', 'Jesse', 'Craig', 'Alan', 'Shawn', 'Clarence', 'Sean', 'Philip', 'Chris', 'Johnny', 'Earl', 'Jimmy', 'Antonio', 'Danny', 'Bryan', 'Tony', 'Luis', 'Mike', 'Stanley', 'Leonard', 'Nathan', 'Dale', 'Manuel', 'Rodney', 'Curtis', 'Norman', 'Allen', 'Marvin', 'Vincent', 'Glenn', 'Jeffery', 'Travis', 'Jeff', 'Chad', 'Jacob', 'Lee', 'Melvin', 'Alfred', 'Kyle', 'Francis', 'Bradley', 'Jesus', 'Herbert', 'Frederick', 'Ray', 'Joel', 'Edwin', 'Don', 'Eddie', 'Ricky', 'Troy', 'Randall', 'Barry', 'Alexander', 'Bernard', 'Mario', 'Leroy', 'Francisco', 'Marcus', 'Micheal', 'Theodore', 'Clifford', 'Miguel', 'Oscar', 'Jay', 'Jim', 'Tom', 'Calvin', 'Alex', 'Jon', 'Ronnie', 'Bill', 'Lloyd', 'Tommy', 'Leon', 'Derek', 'Warren', 'Darrell', 'Jerome', 'Floyd', 'Leo', 'Alvin', 'Tim', 'Wesley', 'Gordon', 'Dean', 'Greg', 'Jorge', 'Dustin', 'Pedro', 'Derrick', 'Dan', 'Lewis', 'Zachary', 'Corey', 'Herman', 'Maurice', 'Vernon', 'Roberto', 'Clyde', 'Glen', 'Hector', 'Shane', 'Ricardo', 'Sam', 'Rick', 'Lester', 'Brent', 'Ramon', 'Charlie', 'Tyler', 'Gilbert', 'Gene', 'Marc', 'Reginald', 'Ruben', 'Brett', 'Angel', 'Nathaniel', 'Rafael', 'Leslie', 'Edgar', 'Milton', 'Raul', 'Ben', 'Chester', 'Cecil', 'Duane', 'Franklin', 'Andre', 'Elmer', 'Brad', 'Gabriel', 'Ron', 'Mitchell', 'Roland', 'Arnold', 'Harvey', 'Jared', 'Adrian', 'Karl', 'Cory', 'Claude', 'Erik', 'Darryl', 'Jamie', 'Neil', 'Jessie', 'Christian', 'Javier', 'Fernando', 'Clinton', 'Ted', 'Mathew', 'Tyrone', 'Darren', 'Lonnie', 'Lance', 'Cody', 'Julio', 'Kelly', 'Kurt', 'Allan', 'Nelson', 'Guy', 'Clayton', 'Hugh', 'Max', 'Dwayne', 'Dwight', 'Armando', 'Felix', 'Jimmie', 'Everett', 'Jordan', 'Ian', 'Wallace', 'Ken', 'Bob', 'Jaime', 'Casey', 'Alfredo', 'Alberto', 'Dave', 'Ivan', 'Johnnie', 'Sidney', 'Byron', 'Julian', 'Isaac', 'Morris', 'Clifton', 'Willard', 'Daryl', 'Ross', 'Virgil', 'Andy', 'Marshall', 'Salvador', 'Perry', 'Kirk', 'Sergio', 'Marion', 'Tracy', 'Seth', 'Kent', 'Terrance', 'Rene', 'Eduardo', 'Terrence', 'Enrique', 'Freddie', 'Wade'];
          var surnames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Martin', 'Jackson', 'Thompson', 'White', 'Lopez', 'Lee', 'Gonzalez', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Perez', 'Hall', 'Young', 'Allen', 'Sanchez', 'Wright', 'King', 'Scott', 'Green', 'Baker', 'Adams', 'Nelson', 'Hill', 'Ramirez', 'Campbell', 'Mitchell', 'Roberts', 'Carter', 'Phillips', 'Evans', 'Turner', 'Torres', 'Parker', 'Collins', 'Edwards', 'Stewart', 'Flores', 'Morris', 'Nguyen', 'Murphy', 'Rivera', 'Cook', 'Rogers', 'Morgan', 'Peterson', 'Cooper', 'Reed', 'Bailey', 'Bell', 'Gomez', 'Kelly', 'Howard', 'Ward', 'Cox', 'Diaz', 'Richardson', 'Wood', 'Watson', 'Brooks', 'Bennett', 'Gray', 'James', 'Reyes', 'Cruz', 'Hughes', 'Price', 'Myers', 'Long', 'Foster', 'Sanders', 'Ross', 'Morales', 'Powell', 'Sullivan', 'Russell', 'Ortiz', 'Jenkins', 'Gutierrez', 'Perry', 'Butler', 'Barnes', 'Fisher'];
           var genderCode = Math.floor(Math.random()*$rootScope.genders.length);
           if (genderCode == 1 || genderCode == 3) {
             $rootScope.newPatient.given = maleNames[Math.floor(Math.random()*maleNames.length)];
           } else {
             $rootScope.newPatient.given = femaleNames[Math.floor(Math.random()*femaleNames.length)];
           }
           $rootScope.newPatient.family = surnames[Math.floor(Math.random()*surnames.length)];
           $rootScope.newPatient.gender = $rootScope.genders[genderCode];
        }; 
    
    });
})();
