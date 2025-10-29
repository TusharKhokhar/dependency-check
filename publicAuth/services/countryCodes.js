const {setSuccessResponse} = require("./api-handler");

module.exports.countryCodes = (req, res) => {
        let response = [
        {
            "CountryName": "Afghanistan",
            "ISO": "AFG",
            "Code": "004"
        },
        {
            "CountryName": "Albania",
            "ISO": "ALB",
            "Code": "008"
        },
        {
            "CountryName": "Algeria",
            "ISO": "DZA",
            "Code": "012"
        },
        {
            "CountryName": "American Samoa",
            "ISO": "ASM",
            "Code": "016"
        },
        {
            "CountryName": "Andorra",
            "ISO": "AND",
            "Code": "020"
        },
        {
            "CountryName": "Angola",
            "ISO": "AGO",
            "Code": "024"
        },
        {
            "CountryName": "Anguila",
            "ISO": "AIA",
            "Code": 660
        },
        {
            "CountryName": "Antigua and Barbuda",
            "ISO": "ATG",
            "Code": "028"
        },
        {
            "CountryName": "Argentina",
            "ISO": "ARG",
            "Code": "032"
        },
        {
            "CountryName": "Armenia",
            "ISO": "ARM",
            "Code": "051"
        },
        {
            "CountryName": "Aruba",
            "ISO": "ABW",
            "Code": 533
        },
        {
            "CountryName": "Australia",
            "ISO": "AUS",
            "Code": "036"
        },
        {
            "CountryName": "Austria",
            "ISO": "AUT",
            "Code": "040"
        },
        {
            "CountryName": "Azerbaijan",
            "ISO": "AZE",
            "Code": "031"
        },
        {
            "CountryName": "Bahamas, The",
            "ISO": "BHS",
            "Code": "044"
        },
        {
            "CountryName": "Bahrain",
            "ISO": "BHR",
            "Code": "048"
        },
        {
            "CountryName": "Bangladesh",
            "ISO": "BGD",
            "Code": "050"
        },
        {
            "CountryName": "Barbados",
            "ISO": "BRB",
            "Code": "052"
        },
        {
            "CountryName": "Belarus",
            "ISO": "BLR",
            "Code": 112
        },
        {
            "CountryName": "Belgium",
            "ISO": "BEL",
            "Code": "056"
        },
        {
            "CountryName": "Belgium-Luxembourg",
            "ISO": "BLX",
            "Code": "058"
        },
        {
            "CountryName": "Belize",
            "ISO": "BLZ",
            "Code": "084"
        },
        {
            "CountryName": "Benin",
            "ISO": "BEN",
            "Code": 204
        },
        {
            "CountryName": "Bermuda",
            "ISO": "BMU",
            "Code": "060"
        },
        {
            "CountryName": "Bhutan",
            "ISO": "BTN",
            "Code": "064"
        },
        {
            "CountryName": "Bolivia",
            "ISO": "BOL",
            "Code": "068"
        },
        {
            "CountryName": "Bosnia and Herzegovina",
            "ISO": "BIH",
            "Code": "070"
        },
        {
            "CountryName": "Botswana",
            "ISO": "BWA",
            "Code": "072"
        },
        {
            "CountryName": "Br. Antr. Terr",
            "ISO": "BAT",
            "Code": "080"
        },
        {
            "CountryName": "Brazil",
            "ISO": "BRA",
            "Code": "076"
        },
        {
            "CountryName": "British Indian Ocean Ter.",
            "ISO": "IOT",
            "Code": "086"
        },
        {
            "CountryName": "British Virgin Islands",
            "ISO": "VGB",
            "Code": "092"
        },
        {
            "CountryName": "Brunei",
            "ISO": "BRN",
            "Code": "096"
        },
        {
            "CountryName": "Bulgaria",
            "ISO": "BGR",
            "Code": 100
        },
        {
            "CountryName": "Burkina Faso",
            "ISO": "BFA",
            "Code": 854
        },
        {
            "CountryName": "Burundi",
            "ISO": "BDI",
            "Code": 108
        },
        {
            "CountryName": "Cambodia",
            "ISO": "KHM",
            "Code": 116
        },
        {
            "CountryName": "Cameroon",
            "ISO": "CMR",
            "Code": 120
        },
        {
            "CountryName": "Canada",
            "ISO": "CAN",
            "Code": 124
        },
        {
            "CountryName": "Cape Verde",
            "ISO": "CPV",
            "Code": 132
        },
        {
            "CountryName": "Cayman Islands",
            "ISO": "CYM",
            "Code": 136
        },
        {
            "CountryName": "Central African Republic",
            "ISO": "CAF",
            "Code": 140
        },
        {
            "CountryName": "Chad",
            "ISO": "TCD",
            "Code": 148
        },
        {
            "CountryName": "Chile",
            "ISO": "CHL",
            "Code": 152
        },
        {
            "CountryName": "China",
            "ISO": "CHN",
            "Code": 156
        },
        {
            "CountryName": "Christmas Island",
            "ISO": "CXR",
            "Code": 162
        },
        {
            "CountryName": "Cocos (Keeling) Islands",
            "ISO": "CCK",
            "Code": 166
        },
        {
            "CountryName": "Colombia",
            "ISO": "COL",
            "Code": 170
        },
        {
            "CountryName": "Comoros",
            "ISO": "COM",
            "Code": 174
        },
        {
            "CountryName": "Congo, Dem. Rep.",
            "ISO": "ZAR",
            "Code": 180
        },
        {
            "CountryName": "Congo, Rep.",
            "ISO": "COG",
            "Code": 178
        },
        {
            "CountryName": "Cook Islands",
            "ISO": "COK",
            "Code": 184
        },
        {
            "CountryName": "Costa Rica",
            "ISO": "CRI",
            "Code": 188
        },
        {
            "CountryName": "Cote d'Ivoire",
            "ISO": "CIV",
            "Code": 384
        },
        {
            "CountryName": "Croatia",
            "ISO": "HRV",
            "Code": 191
        },
        {
            "CountryName": "Cuba",
            "ISO": "CUB",
            "Code": 192
        },
        {
            "CountryName": "Cyprus",
            "ISO": "CYP",
            "Code": 196
        },
        {
            "CountryName": "Czech Republic",
            "ISO": "CZE",
            "Code": 203
        },
        {
            "CountryName": "Czechoslovakia",
            "ISO": "CSK",
            "Code": 200
        },
        {
            "CountryName": "Denmark",
            "ISO": "DNK",
            "Code": 208
        },
        {
            "CountryName": "Djibouti",
            "ISO": "DJI",
            "Code": 262
        },
        {
            "CountryName": "Dominica",
            "ISO": "DMA",
            "Code": 212
        },
        {
            "CountryName": "Dominican Republic",
            "ISO": "DOM",
            "Code": 214
        },
        {
            "CountryName": "East Timor",
            "ISO": "TMP",
            "Code": 626
        },
        {
            "CountryName": "Ecuador",
            "ISO": "ECU",
            "Code": 218
        },
        {
            "CountryName": "Egypt, Arab Rep.",
            "ISO": "EGY",
            "Code": 818
        },
        {
            "CountryName": "El Salvador",
            "ISO": "SLV",
            "Code": 222
        },
        {
            "CountryName": "Equatorial Guinea",
            "ISO": "GNQ",
            "Code": 226
        },
        {
            "CountryName": "Eritrea",
            "ISO": "ERI",
            "Code": 232
        },
        {
            "CountryName": "Estonia",
            "ISO": "EST",
            "Code": 233
        },
        {
            "CountryName": "Ethiopia (excludes Eritrea)",
            "ISO": "ETH",
            "Code": 231
        },
        {
            "CountryName": "Ethiopia (includes Eritrea)",
            "ISO": "ETF",
            "Code": 230
        },
        {
            "CountryName": "European Union",
            "ISO": "EUN",
            "Code": 918
        },
        {
            "CountryName": "Faeroe Islands",
            "ISO": "FRO",
            "Code": 234
        },
        {
            "CountryName": "Falkland Island",
            "ISO": "FLK",
            "Code": 238
        },
        {
            "CountryName": "Fiji",
            "ISO": "FJI",
            "Code": 242
        },
        {
            "CountryName": "Finland",
            "ISO": "FIN",
            "Code": 246
        },
        {
            "CountryName": "Fm Panama Cz",
            "ISO": "PCZ",
            "Code": 592
        },
        {
            "CountryName": "Fm Rhod Nyas",
            "ISO": "ZW1",
            "Code": 717
        },
        {
            "CountryName": "Fm Tanganyik",
            "ISO": "TAN",
            "Code": 835
        },
        {
            "CountryName": "Fm Vietnam Dr",
            "ISO": "VDR",
            "Code": 868
        },
        {
            "CountryName": "Fm Vietnam Rp",
            "ISO": "SVR",
            "Code": 866
        },
        {
            "CountryName": "Fm Zanz-Pemb",
            "ISO": "ZPM",
            "Code": 836
        },
        {
            "CountryName": "Fr. So. Ant. Tr",
            "ISO": "ATF",
            "Code": 260
        },
        {
            "CountryName": "France",
            "ISO": "FRA",
            "Code": 250
        },
        {
            "CountryName": "Free Zones",
            "ISO": "FRE",
            "Code": 838
        },
        {
            "CountryName": "French Guiana",
            "ISO": "GUF",
            "Code": 254
        },
        {
            "CountryName": "French Polynesia",
            "ISO": "PYF",
            "Code": 258
        },
        {
            "CountryName": "Gabon",
            "ISO": "GAB",
            "Code": 266
        },
        {
            "CountryName": "Gambia, The",
            "ISO": "GMB",
            "Code": 270
        },
        {
            "CountryName": "Gaza Strip",
            "ISO": "GAZ",
            "Code": 274
        },
        {
            "CountryName": "Georgia",
            "ISO": "GEO",
            "Code": 268
        },
        {
            "CountryName": "German Democratic Republic",
            "ISO": "DDR",
            "Code": 278
        },
        {
            "CountryName": "Germany",
            "ISO": "DEU",
            "Code": 276
        },
        {
            "CountryName": "Ghana",
            "ISO": "GHA",
            "Code": 288
        },
        {
            "CountryName": "Gibraltar",
            "ISO": "GIB",
            "Code": 292
        },
        {
            "CountryName": "Greece",
            "ISO": "GRC",
            "Code": 300
        },
        {
            "CountryName": "Greenland",
            "ISO": "GRL",
            "Code": 304
        },
        {
            "CountryName": "Grenada",
            "ISO": "GRD",
            "Code": 308
        },
        {
            "CountryName": "Guadeloupe",
            "ISO": "GLP",
            "Code": 312
        },
        {
            "CountryName": "Guam",
            "ISO": "GUM",
            "Code": 316
        },
        {
            "CountryName": "Guatemala",
            "ISO": "GTM",
            "Code": 320
        },
        {
            "CountryName": "Guinea",
            "ISO": "GIN",
            "Code": 324
        },
        {
            "CountryName": "Guinea-Bissau",
            "ISO": "GNB",
            "Code": 624
        },
        {
            "CountryName": "Guyana",
            "ISO": "GUY",
            "Code": 328
        },
        {
            "CountryName": "Haiti",
            "ISO": "HTI",
            "Code": 332
        },
        {
            "CountryName": "Holy See",
            "ISO": "VAT",
            "Code": 336
        },
        {
            "CountryName": "Honduras",
            "ISO": "HND",
            "Code": 340
        },
        {
            "CountryName": "Hong Kong, China",
            "ISO": "HKG",
            "Code": 344
        },
        {
            "CountryName": "Hungary",
            "ISO": "HUN",
            "Code": 348
        },
        {
            "CountryName": "Iceland",
            "ISO": "ISL",
            "Code": 352
        },
        {
            "CountryName": "India",
            "ISO": "IND",
            "Code": 356
        },
        {
            "CountryName": "Indonesia",
            "ISO": "IDN",
            "Code": 360
        },
        {
            "CountryName": "Iran, Islamic Rep.",
            "ISO": "IRN",
            "Code": 364
        },
        {
            "CountryName": "Iraq",
            "ISO": "IRQ",
            "Code": 368
        },
        {
            "CountryName": "Ireland",
            "ISO": "IRL",
            "Code": 372
        },
        {
            "CountryName": "Israel",
            "ISO": "ISR",
            "Code": 376
        },
        {
            "CountryName": "Italy",
            "ISO": "ITA",
            "Code": 380
        },
        {
            "CountryName": "Jamaica",
            "ISO": "JAM",
            "Code": 388
        },
        {
            "CountryName": "Japan",
            "ISO": "JPN",
            "Code": 392
        },
        {
            "CountryName": "Jhonston Island",
            "ISO": "JTN",
            "Code": 396
        },
        {
            "CountryName": "Jordan",
            "ISO": "JOR",
            "Code": 400
        },
        {
            "CountryName": "Kazakhstan",
            "ISO": "KAZ",
            "Code": 398
        },
        {
            "CountryName": "Kenya",
            "ISO": "KEN",
            "Code": 404
        },
        {
            "CountryName": "Kiribati",
            "ISO": "KIR",
            "Code": 296
        },
        {
            "CountryName": "Korea, Dem. Rep.",
            "ISO": "PRK",
            "Code": 408
        },
        {
            "CountryName": "Korea, Rep.",
            "ISO": "KOR",
            "Code": 410
        },
        {
            "CountryName": "Kuwait",
            "ISO": "KWT",
            "Code": 414
        },
        {
            "CountryName": "Kyrgyz Republic",
            "ISO": "KGZ",
            "Code": 417
        },
        {
            "CountryName": "Lao PDR",
            "ISO": "LAO",
            "Code": 418
        },
        {
            "CountryName": "Latvia",
            "ISO": "LVA",
            "Code": 428
        },
        {
            "CountryName": "Lebanon",
            "ISO": "LBN",
            "Code": 422
        },
        {
            "CountryName": "Lesotho",
            "ISO": "LSO",
            "Code": 426
        },
        {
            "CountryName": "Liberia",
            "ISO": "LBR",
            "Code": 430
        },
        {
            "CountryName": "Libya",
            "ISO": "LBY",
            "Code": 434
        },
        {
            "CountryName": "Liechtenstein",
            "ISO": "LIE",
            "Code": 438
        },
        {
            "CountryName": "Lithuania",
            "ISO": "LTU",
            "Code": 440
        },
        {
            "CountryName": "Luxembourg",
            "ISO": "LUX",
            "Code": 442
        },
        {
            "CountryName": "Macao",
            "ISO": "MAC",
            "Code": 446
        },
        {
            "CountryName": "Macedonia, FYR",
            "ISO": "MKD",
            "Code": 807
        },
        {
            "CountryName": "Madagascar",
            "ISO": "MDG",
            "Code": 450
        },
        {
            "CountryName": "Malawi",
            "ISO": "MWI",
            "Code": 454
        },
        {
            "CountryName": "Malaysia",
            "ISO": "MYS",
            "Code": 458
        },
        {
            "CountryName": "Maldives",
            "ISO": "MDV",
            "Code": 462
        },
        {
            "CountryName": "Mali",
            "ISO": "MLI",
            "Code": 466
        },
        {
            "CountryName": "Malta",
            "ISO": "MLT",
            "Code": 470
        },
        {
            "CountryName": "Marshall Islands",
            "ISO": "MHL",
            "Code": 584
        },
        {
            "CountryName": "Martinique",
            "ISO": "MTQ",
            "Code": 474
        },
        {
            "CountryName": "Mauritania",
            "ISO": "MRT",
            "Code": 478
        },
        {
            "CountryName": "Mauritius",
            "ISO": "MUS",
            "Code": 480
        },
        {
            "CountryName": "Mexico",
            "ISO": "MEX",
            "Code": 484
        },
        {
            "CountryName": "Micronesia, Fed. Sts.",
            "ISO": "FSM",
            "Code": 583
        },
        {
            "CountryName": "Midway Islands",
            "ISO": "MID",
            "Code": 488
        },
        {
            "CountryName": "Moldova",
            "ISO": "MDA",
            "Code": 498
        },
        {
            "CountryName": "Monaco",
            "ISO": "MCO",
            "Code": 492
        },
        {
            "CountryName": "Mongolia",
            "ISO": "MNG",
            "Code": 496
        },
        {
            "CountryName": "Montserrat",
            "ISO": "MSR",
            "Code": 500
        },
        {
            "CountryName": "Morocco",
            "ISO": "MAR",
            "Code": 504
        },
        {
            "CountryName": "Mozambique",
            "ISO": "MOZ",
            "Code": 508
        },
        {
            "CountryName": "Myanmar",
            "ISO": "MMR",
            "Code": 104
        },
        {
            "CountryName": "Namibia",
            "ISO": "NAM",
            "Code": 516
        },
        {
            "CountryName": "Nauru",
            "ISO": "NRU",
            "Code": 520
        },
        {
            "CountryName": "Nepal",
            "ISO": "NPL",
            "Code": 524
        },
        {
            "CountryName": "Netherlands",
            "ISO": "NLD",
            "Code": 528
        },
        {
            "CountryName": "Netherlands Antilles",
            "ISO": "ANT",
            "Code": 530
        },
        {
            "CountryName": "Neutral Zone",
            "ISO": "NZE",
            "Code": 536
        },
        {
            "CountryName": "New Caledonia",
            "ISO": "NCL",
            "Code": 540
        },
        {
            "CountryName": "New Zealand",
            "ISO": "NZL",
            "Code": 554
        },
        {
            "CountryName": "Nicaragua",
            "ISO": "NIC",
            "Code": 558
        },
        {
            "CountryName": "Niger",
            "ISO": "NER",
            "Code": 562
        },
        {
            "CountryName": "Nigeria",
            "ISO": "NGA",
            "Code": 566
        },
        {
            "CountryName": "Niue",
            "ISO": "NIU",
            "Code": 570
        },
        {
            "CountryName": "Norfolk Island",
            "ISO": "NFK",
            "Code": 574
        },
        {
            "CountryName": "Northern Mariana Islands",
            "ISO": "MNP",
            "Code": 580
        },
        {
            "CountryName": "Norway",
            "ISO": "NOR",
            "Code": 578
        },
        {
            "CountryName": "Oman",
            "ISO": "OMN",
            "Code": 512
        },
        {
            "CountryName": "Pacific Islands",
            "ISO": "PCE",
            "Code": 582
        },
        {
            "CountryName": "Pakistan",
            "ISO": "PAK",
            "Code": 586
        },
        {
            "CountryName": "Palau",
            "ISO": "PLW",
            "Code": 585
        },
        {
            "CountryName": "Panama",
            "ISO": "PAN",
            "Code": 591
        },
        {
            "CountryName": "Papua New Guinea",
            "ISO": "PNG",
            "Code": 598
        },
        {
            "CountryName": "Paraguay",
            "ISO": "PRY",
            "Code": 600
        },
        {
            "CountryName": "Pen Malaysia",
            "ISO": "PMY",
            "Code": 459
        },
        {
            "CountryName": "Peru",
            "ISO": "PER",
            "Code": 604
        },
        {
            "CountryName": "Philippines",
            "ISO": "PHL",
            "Code": 608
        },
        {
            "CountryName": "Pitcairn",
            "ISO": "PCN",
            "Code": 612
        },
        {
            "CountryName": "Poland",
            "ISO": "POL",
            "Code": 616
        },
        {
            "CountryName": "Portugal",
            "ISO": "PRT",
            "Code": 620
        },
        {
            "CountryName": "Puerto Rico",
            "ISO": "PRI",
            "Code": 630
        },
        {
            "CountryName": "Qatar",
            "ISO": "QAT",
            "Code": 634
        },
        {
            "CountryName": "Reunion",
            "ISO": "REU",
            "Code": 638
        },
        {
            "CountryName": "Romania",
            "ISO": "ROM",
            "Code": 642
        },
        {
            "CountryName": "Russian Federation",
            "ISO": "RUS",
            "Code": 643
        },
        {
            "CountryName": "Rwanda",
            "ISO": "RWA",
            "Code": 646
        },
        {
            "CountryName": "Ryukyu Is",
            "ISO": "RYU",
            "Code": 647
        },
        {
            "CountryName": "Sabah",
            "ISO": "SBH",
            "Code": 461
        },
        {
            "CountryName": "Saint Helena",
            "ISO": "SHN",
            "Code": 654
        },
        {
            "CountryName": "Saint Kitts-Nevis-Anguilla-Aru",
            "ISO": "KN1",
            "Code": 658
        },
        {
            "CountryName": "Saint Pierre and Miquelon",
            "ISO": "SPM",
            "Code": 666
        },
        {
            "CountryName": "Samoa",
            "ISO": "WSM",
            "Code": 882
        },
        {
            "CountryName": "San Marino",
            "ISO": "SMR",
            "Code": 674
        },
        {
            "CountryName": "Sao Tome and Principe",
            "ISO": "STP",
            "Code": 678
        },
        {
            "CountryName": "Sarawak",
            "ISO": "SWK",
            "Code": 457
        },
        {
            "CountryName": "Saudi Arabia",
            "ISO": "SAU",
            "Code": 682
        },
        {
            "CountryName": "Senegal",
            "ISO": "SEN",
            "Code": 686
        },
        {
            "CountryName": "Seychelles",
            "ISO": "SYC",
            "Code": 690
        },
        {
            "CountryName": "Sierra Leone",
            "ISO": "SLE",
            "Code": 694
        },
        {
            "CountryName": "SIKKIM",
            "ISO": "SIK",
            "Code": 698
        },
        {
            "CountryName": "Singapore",
            "ISO": "SGP",
            "Code": 702
        },
        {
            "CountryName": "Slovak Republic",
            "ISO": "SVK",
            "Code": 703
        },
        {
            "CountryName": "Slovenia",
            "ISO": "SVN",
            "Code": 705
        },
        {
            "CountryName": "Solomon Islands",
            "ISO": "SLB",
            "Code": "090"
        },
        {
            "CountryName": "Somalia",
            "ISO": "SOM",
            "Code": 706
        },
        {
            "CountryName": "South Africa",
            "ISO": "ZAF",
            "Code": 710
        },
        {
            "CountryName": "Soviet Union",
            "ISO": "SVU",
            "Code": 810
        },
        {
            "CountryName": "Spain",
            "ISO": "ESP",
            "Code": 724
        },
        {
            "CountryName": "Special Categories",
            "ISO": "SPE",
            "Code": 839
        },
        {
            "CountryName": "Sri Lanka",
            "ISO": "LKA",
            "Code": 144
        },
        {
            "CountryName": "St. Kitts and Nevis",
            "ISO": "KNA",
            "Code": 659
        },
        {
            "CountryName": "St. Lucia",
            "ISO": "LCA",
            "Code": 662
        },
        {
            "CountryName": "St. Vincent and the Grenadines",
            "ISO": "VCT",
            "Code": 670
        },
        {
            "CountryName": "Sudan",
            "ISO": "SDN",
            "Code": 736
        },
        {
            "CountryName": "Suriname",
            "ISO": "SUR",
            "Code": 740
        },
        {
            "CountryName": "Svalbard and Jan Mayen Is",
            "ISO": "SJM",
            "Code": 744
        },
        {
            "CountryName": "Swaziland",
            "ISO": "SWZ",
            "Code": 748
        },
        {
            "CountryName": "Sweden",
            "ISO": "SWE",
            "Code": 752
        },
        {
            "CountryName": "Switzerland",
            "ISO": "CHE",
            "Code": 756
        },
        {
            "CountryName": "Syrian Arab Republic",
            "ISO": "SYR",
            "Code": 760
        },
        {
            "CountryName": "Taiwan",
            "ISO": "TWN",
            "Code": 158
        },
        {
            "CountryName": "Tajikistan",
            "ISO": "TJK",
            "Code": 762
        },
        {
            "CountryName": "Tanzania",
            "ISO": "TZA",
            "Code": 834
        },
        {
            "CountryName": "Thailand",
            "ISO": "THA",
            "Code": 764
        },
        {
            "CountryName": "Togo",
            "ISO": "TGO",
            "Code": 768
        },
        {
            "CountryName": "Tokelau",
            "ISO": "TKL",
            "Code": 772
        },
        {
            "CountryName": "Tonga",
            "ISO": "TON",
            "Code": 776
        },
        {
            "CountryName": "Trinidad and Tobago",
            "ISO": "TTO",
            "Code": 780
        },
        {
            "CountryName": "Tunisia",
            "ISO": "TUN",
            "Code": 788
        },
        {
            "CountryName": "Turkey",
            "ISO": "TUR",
            "Code": 792
        },
        {
            "CountryName": "Turkmenistan",
            "ISO": "TKM",
            "Code": 795
        },
        {
            "CountryName": "Turks and Caicos Isl.",
            "ISO": "TCA",
            "Code": 796
        },
        {
            "CountryName": "Tuvalu",
            "ISO": "TUV",
            "Code": 798
        },
        {
            "CountryName": "Uganda",
            "ISO": "UGA",
            "Code": 800
        },
        {
            "CountryName": "Ukraine",
            "ISO": "UKR",
            "Code": 804
        },
        {
            "CountryName": "United Arab Emirates",
            "ISO": "ARE",
            "Code": 784
        },
        {
            "CountryName": "United Kingdom",
            "ISO": "GBR",
            "Code": 826
        },
        {
            "CountryName": "United States",
            "ISO": "USA",
            "Code": 840
        },
        {
            "CountryName": "Unspecified",
            "ISO": "UNS",
            "Code": 898
        },
        {
            "CountryName": "Uruguay",
            "ISO": "URY",
            "Code": 858
        },
        {
            "CountryName": "Us Msc.Pac.I",
            "ISO": "USP",
            "Code": 849
        },
        {
            "CountryName": "Uzbekistan",
            "ISO": "UZB",
            "Code": 860
        },
        {
            "CountryName": "Vanuatu",
            "ISO": "VUT",
            "Code": 548
        },
        {
            "CountryName": "Venezuela",
            "ISO": "VEN",
            "Code": 862
        },
        {
            "CountryName": "Vietnam",
            "ISO": "VNM",
            "Code": 704
        },
        {
            "CountryName": "Virgin Islands (U.S.)",
            "ISO": "VIR",
            "Code": 850
        },
        {
            "CountryName": "Wake Island",
            "ISO": "WAK",
            "Code": 872
        },
        {
            "CountryName": "Wallis and Futura Isl.",
            "ISO": "WLF",
            "Code": 876
        },
        {
            "CountryName": "Western Sahara",
            "ISO": "ESH",
            "Code": 732
        },
        {
            "CountryName": "World",
            "ISO": "WLD",
            "Code": "000"
        },
        {
            "CountryName": "Yemen Democratic",
            "ISO": "YDR",
            "Code": 720
        },
        {
            "CountryName": "Yemen, Rep.",
            "ISO": "YEM",
            "Code": 887
        },
        {
            "CountryName": "Yugoslavia",
            "ISO": "SER",
            "Code": 891
        },
        {
            "CountryName": "Yugoslavia, FR (Serbia/Montene",
            "ISO": "YUG",
            "Code": 890
        },
        {
            "CountryName": "Zambia",
            "ISO": "ZMB",
            "Code": 894
        },
        {
            "CountryName": "Zimbabwe",
            "ISO": "ZWE",
            "Code": 716
        }
    ]
    setSuccessResponse(response, res, req)
}
